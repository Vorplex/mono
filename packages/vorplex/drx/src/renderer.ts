import { $Path, $Value, Context, ContextValue, Getter, Scope, Signal, SignalProxy, State } from '@vorplex/core';
import { $Element } from '@vorplex/web';
import type { DrxDocument, DrxDocumentState, DrxScope } from './document';
import { DrxDocumentStyles } from './document-styles';
import { DrxDom } from './dom';
import { DrxExpression } from './expression';
import { DrxIconSheet } from './icon-sheet';
import { DrxModalManager } from './modal-manager';
import { DrxAsset } from './node/asset';
import { DrxComponent } from './node/component/component';
import type { DrxComponentInstance } from './node/component/instance';
import { DrxLibraries } from './node/libraries';
import { NodeType } from './node/node-type';
import { DrxTemplateItem } from './node/template-item';
import { DrxApplicationHost, DrxComponentHost, DrxHost, DrxPageHost, DrxRenderContext } from './render-context';
import { DrxRouter } from './router';
import { DrxScripting, type DrxApiClient, type DrxVariableApi } from './scripting';
import { DrxStyleSheet } from './style-sheet';
import { DrxView } from './view';

export interface DrxNodeContext {
    scope: DrxScope;
    state: Signal<DrxDocumentState>;
    next(parent?: Node): DrxView | null;
    renderTemplate(parent: Node, template: Getter<DrxTemplateItem[]>): void;
}

export type DrxRenderNode = (parent: Node, item: DrxTemplateItem, context: DrxNodeContext) => DrxView | null;

export interface DrxRendererOptions {
    bundle?: string;
    expression?: DrxExpression;
    renderNode?: DrxRenderNode;
    styles?: Getter<string>[];
}

export interface DrxRenderTarget {
    type: 'app' | 'page' | 'component';
    id: string;
}

export interface DrxDocumentInstance {
    variables: { locals: Record<string, any>; states: Map<string, State<any>> };
    services: Map<string, any>;
    locals: Record<string, any>;
    api: {
        variables: Record<string, DrxVariableApi>;
        services: Record<string, any>;
        apis: Record<string, DrxApiClient>;
    };
    dependencies: {
        locals: Record<string, any>;
        api: Record<string, DrxDocumentInstance['api']>;
    };
}

export class DrxRenderer {

    private expression: DrxExpression;
    private realm: typeof globalThis;
    private scripts?: Record<string, any>;
    private readonly instances = new Map<string | undefined, DrxDocumentInstance>();
    private readonly instanceScopes: Scope[] = [];

    constructor(private readonly root: DrxDocument, private readonly options: DrxRendererOptions = {}) {
        this.expression = options.expression;
    }

    private get scope(): DrxScope {
        return DrxRenderContext.host()?.scope ?? { type: 'app' };
    }

    private get proxy(): SignalProxy<DrxDocumentState> {
        return this.root.state.signal.proxy;
    }

    private loadScripts(): Record<string, any> | undefined {
        return this.scripts ??= DrxScripting.load(this.options.bundle, this.realm);
    }

    public render(parent: Node, target?: DrxRenderTarget): Scope {
        this.realm = parent.ownerDocument.defaultView;
        this.expression ??= new DrxExpression(this.realm);
        return Signal.root(() => {
            Signal.cleanup(() => {
                for (const scope of this.instanceScopes.splice(0)) scope.dispose();
                this.instances.clear();
            });
            DrxIconSheet.load();
            const template = target && target.type !== 'app'
                ? [{ type: target.type === 'page' ? NodeType.Page : NodeType.Component, id: target.id }]
                : undefined;
            const group = DrxRouter.createGroup();
            const output = this.renderHost(
                parent,
                NodeType.App,
                root => {
                    const host: DrxApplicationHost = {
                        type: NodeType.App,
                        app: this.root.state.value.app,
                        scope: { type: 'app' },
                        root,
                        locals: {},
                        variables: new Map()
                    };
                    const state = this.root.state.value;
                    const view = host.root.ownerDocument.defaultView;
                    const instance = this.getInstance();
                    const variables = host.app.variableIds.map(id => state.variables[id]);
                    host.router = DrxRouter.mount(view);
                    this.instantiateHost(host, host.app.id, instance.variables, { ...instance.dependencies.locals, asset: instance.locals.asset, router: host.router }, () => ({
                        app: { variables: DrxScripting.createVariableApis(state, variables, host.variables, host.scope) },
                        apis: instance.api.apis,
                        services: instance.api.services,
                        libraries: instance.dependencies.api,
                        router: DrxRouter.createApi(view, host.router.route),
                        pages: this.createPagesApi(host)
                    }));
                    return host;
                },
                host => {
                    host.style = DrxStyleSheet.create(host.root.ownerDocument.defaultView, () => this.expression.parse(this.proxy.app.style() ?? '', host.locals));
                    DrxStyleSheet.attach(host.root.ownerDocument, host.style);
                    DrxStyleSheet.adopt(host.root, host.style);
                    this.renderTemplate(host.root, () => template ?? this.proxy.app.template());
                    group.ready(true);
                },
                host => [DrxRenderContext.application.as(host), DrxRenderContext.route.as({ group })]
            );
            Signal.cleanup(() => output.dispose());
            output.mount(parent);
        });
    }

    public renderTemplate(parent: Node, template: Getter<DrxTemplateItem[]>): void {
        const entries = Signal.keyed(template, entry => `${entry.value.type}:${entry.value.id}`, entry => {
            const anchor = parent.ownerDocument.createComment(entry().value.id);
            parent.appendChild(anchor);
            Signal.cleanup(() => anchor.remove());
            let output: DrxView | null;
            Signal.effect(() => {
                const item = entry().value;
                try {
                    output = this.options.renderNode
                        ? this.options.renderNode(parent, item, {
                            scope: this.scope,
                            state: this.root.state.signal,
                            next: (target = parent) => this.renderNode(target, item),
                            renderTemplate: (target, template) => this.renderTemplate(target, template)
                        })
                        : this.renderNode(parent, item);
                    const rendered = output;
                    Signal.cleanup(() => rendered?.dispose());
                    rendered?.mount(parent, anchor);
                } catch (error) {
                    output = null;
                    const host = DrxRenderContext.host();
                    const node = item.type === NodeType.Element ? this.root.state.value.elements[item.id].tag : item.type === NodeType.Text ? 'text()' : item.type.toLowerCase();
                    const name = host.type === NodeType.Component ? `component "${host.component.name}"` : host.type === NodeType.Page ? `page "${host.page.name}"` : 'app';
                    console.error(`Failed to render node at path "${$Element.getXPath(parent as Element).replace(/\/$/, '')}/${node}" in ${name}.`, error);
                }
            });
            return { anchor, output: () => output };
        });
        Signal.effect(() => {
            for (const entry of entries()) {
                const output = entry.output();
                if (output) parent.appendChild(output.node);
                parent.appendChild(entry.anchor);
            }
        });
    }

    private renderNode(parent: Node, item: DrxTemplateItem): DrxView | null {
        switch (item.type) {
            case NodeType.Text: {
                const node = parent.ownerDocument.createTextNode('');
                return new DrxView(node, () => Signal.effect(() => {
                    const value = this.expression.parse(this.proxy.texts[item.id].content(), DrxRenderContext.locals());
                    node.textContent = value == null ? '' : String(value);
                }));
            }
            case NodeType.Element: {
                const element = DrxDom.createElement(parent, this.proxy.elements[item.id].tag());
                return new DrxView(element, () => {
                    Signal.effect(() => {
                        if (!('html' in this.proxy.elements[item.id].attributes())) {
                            this.renderTemplate(element, () => this.proxy.elements[item.id].template());
                        }
                    });
                    Signal.effect(() => this.expression.bindAttributes(element, this.proxy.elements[item.id].attributes(), DrxRenderContext.locals()));
                });
            }
            case NodeType.Icon: {
                const element = parent.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'svg');
                return new DrxView(element, () => {
                    Signal.effect(() => this.expression.bindAttributes(element, this.proxy.icons[item.id].attributes(), DrxRenderContext.locals()));
                    Signal.effect(() => DrxIconSheet.apply(element, this.expression.parse(this.proxy.icons[item.id].name(), DrxRenderContext.locals())));
                });
            }
            case NodeType.If: return this.createHost(parent, item, host => Signal.effect(() => {
                const locals = DrxRenderContext.locals();
                const node = this.proxy.ifs[item.id]();
                const branches = [node, ...node.branchIds.map(id => this.proxy.elseIfs[id]())];
                for (const branch of branches) {
                    if (this.expression.evaluate(branch.condition, locals)) {
                        this.renderTemplate(host, () => branch.template);
                        return;
                    }
                }
                if (node.elseId) this.renderTemplate(host, () => this.proxy.elses[node.elseId].template());
            }));
            case NodeType.ElseIf: return this.createHost(parent, item, host => this.renderTemplate(host, () => this.proxy.elseIfs[item.id].template()));
            case NodeType.Else: return this.createHost(parent, item, host => this.renderTemplate(host, () => this.proxy.elses[item.id].template()));
            case NodeType.For: return this.createHost(parent, item, host => Signal.effect(() => {
                const locals = DrxRenderContext.locals();
                const node = this.proxy.fors[item.id]();
                const entries = Signal.keyed(
                    () => this.expression.evaluate(node.each, locals),
                    entry => node.track ? $Value.get(entry.value, node.track) : entry.key,
                    entry => {
                        const element = DrxDom.createHost(host, NodeType.For);
                        host.appendChild(element);
                        Signal.cleanup(() => element.remove());
                        const scoped: Record<string, any> = { [node.as]: entry.proxy.value };
                        if (node.index) scoped[node.index] = entry.proxy.index;
                        if (node.key) scoped[node.key] = entry.proxy.key;
                        DrxRenderContext.locals.use({ ...locals, ...scoped }, () => {
                            this.renderTemplate(element, () => this.proxy.fors[item.id].template());
                        });
                        return element;
                    }
                );
                Signal.effect(() => {
                    for (const entry of entries()) host.appendChild(entry);
                });
            }));
            case NodeType.RouterRoute: return this.createHost(parent, item, host => Signal.effect(() => {
                const application = DrxRenderContext.application();
                const locals = DrxRenderContext.locals();
                const scope = DrxRenderContext.route();
                const group = scope?.group;
                const node = this.proxy.routerRoutes[item.id]();
                if (node.route != null && group) {
                    group.routes(routes => [...routes, node]);
                    Signal.cleanup(() => group.routes(routes => routes.filter(route => route !== node)));
                }
                const match = Signal.memo(() => {
                    const rest = scope?.rest ? scope.rest() : application.router.route();
                    if (rest == null) return null;
                    const path = DrxRouter.normalize(rest);
                    const result = node.route == null
                        ? !group?.ready() || group.routes().some(route => DrxRouter.match(route, path)) ? null : { params: {}, rest: path }
                        : DrxRouter.match(node, path);
                    if (!result) return null;
                    const [pathname] = path.trim().split(/[?#]/, 1);
                    const base = `/${$Path.join(locals.router?.base ?? '/', pathname.slice(0, pathname.length - result.rest.length))}`;
                    return { params: { ...result.params }, rest: result.rest, base };
                });
                const mounted = Signal.memo(() => {
                    const current = match();
                    return current && { params: current.params, base: current.base };
                });
                Signal.effect(() => {
                    const current = mounted();
                    if (!current) return;
                    const child = { rest: () => match()?.rest, group: DrxRouter.createGroup() };
                    const router = DrxRouter.createLocal(application.router.route, { ...locals.router?.params?.() ?? {}, ...current.params }, host.ownerDocument.defaultView, current.base);
                    Context.use(
                        [
                            DrxRenderContext.locals.as({ ...locals, router }),
                            DrxRenderContext.route.as(child)
                        ],
                        () => this.renderTemplate(host, () => this.proxy.routerRoutes[item.id].template())
                    );
                    child.group.ready(true);
                });
            }));
            case NodeType.PageContainer: return this.createHost(parent, item, host => Signal.effect(() => {
                const application = DrxRenderContext.application();
                const locals = DrxRenderContext.locals();
                const name = this.expression.parse(this.proxy.pageContainers[item.id].page(), locals);
                const pageId = this.proxy.app.pageIds().find(id => this.proxy.pages[id].name() === name);
                if (!pageId) throw new Error(`Unknown page "${name}"`);
                DrxRenderContext.locals.use({ ...application.locals, router: locals.router }, () => {
                    this.renderTemplate(host, () => [{ type: NodeType.Page, id: pageId }]);
                });
            }));
            case NodeType.ComponentInstance: {
                const instance = this.proxy.componentInstances[item.id]();
                const name = this.expression.parse(instance.component, DrxRenderContext.locals());
                const resolved = DrxComponent.find(this.root.state.value, this.scope, name);
                if (!resolved) throw new Error(`Unknown component with name "${name}"`);
                return this.renderComponent(parent, resolved.component.id, instance);
            }
            case NodeType.Page: return this.renderHost(
                parent,
                NodeType.Page,
                root => {
                    const host: DrxPageHost = {
                        type: NodeType.Page,
                        page: this.root.state.value.pages[item.id],
                        scope: { type: 'app' },
                        root,
                        locals: { ...DrxRenderContext.locals() },
                        variables: new Map()
                    };
                    const state = this.root.state.value;
                    const application = DrxRenderContext.application();
                    const instance = this.getInstance();
                    const view = host.root.ownerDocument.defaultView;
                    const variables = host.page.variableIds.map(id => state.variables[id]);
                    this.instantiateHost(host, host.page.id, DrxScripting.instantiateVariables(variables), host.locals, () => ({
                        app: {
                            variables: DrxScripting.createVariableApis(state, application.app.variableIds.map(id => state.variables[id]), instance.variables.states, application.scope),
                            get instance() { return application.instance; }
                        },
                        page: { variables: DrxScripting.createVariableApis(state, variables, host.variables, host.scope), root: host.root },
                        apis: instance.api.apis,
                        services: instance.api.services,
                        libraries: instance.dependencies.api,
                        router: DrxRouter.createApi(view, application.router.route, host.locals.router),
                        pages: this.createPagesApi(application),
                        modal: host.locals.modal
                    }));
                    return host;
                },
                host => {
                    DrxStyleSheet.adopt(host.root, DrxRenderContext.application().style, () => this.expression.parse(this.proxy.pages[item.id].style() ?? '', host.locals));
                    DrxStyleSheet.registerDocumentRules(host.root.ownerDocument, item.id, () => this.expression.parse(this.proxy.pages[item.id].style() ?? '', host.locals));
                    this.renderTemplate(host.root, () => this.proxy.pages[item.id].template());
                }
            );
            case NodeType.Component: return this.renderComponent(parent, item.id);
            default: throw new Error(`Unsupported DRX node type "${item.type}"`);
        }
    }

    private createHost(parent: Node, item: DrxTemplateItem, render: (host: Element) => void): DrxView {
        const host = DrxDom.createHost(parent, item.type);
        return new DrxView(host, () => render(host));
    }

    private getInstance(library?: string): DrxDocumentInstance {
        if (!this.instances.has(library)) this.instanceScopes.push(Signal.root(() => {
            const state = this.root.state.value;
            const scope: DrxScope = library ? { type: 'library', library } : { type: 'app' };
            const owner = DrxLibraries.getOwner(state, scope);
            const variables = owner.variableIds.map(id => state.variables[id]);
            const instance: DrxDocumentInstance = {
                variables: DrxScripting.instantiateVariables(variables),
                services: new Map(),
                locals: {},
                api: { variables: {}, services: {}, apis: {} },
                dependencies: { locals: {}, api: {} }
            };
            this.instances.set(library, instance);
            for (const dependency of DrxLibraries.getLinked(state, owner)) {
                const dependencyInstance = this.getInstance(dependency.id);
                instance.dependencies.locals[dependency.id] = dependencyInstance.locals;
                instance.dependencies.api[dependency.id] = dependencyInstance.api;
            }
            Object.assign(instance.locals, instance.variables.locals, { asset: this.createAssetLocals(owner.assetIds) });
            const variableApis = DrxScripting.createVariableApis(state, variables, instance.variables.states, scope);
            const context = library || state.app.type === 'library' ? { library: { variables: variableApis } } : { app: { variables: variableApis } };
            Object.assign(instance.api, {
                variables: variableApis,
                services: DrxScripting.instantiateServices(state, owner.serviceIds, scope, this.loadScripts(), instance.services, this.realm, instance.dependencies.api, context),
                apis: DrxScripting.createApiClients(state, scope, this.realm)
            });
        }));
        return this.instances.get(library);
    }

    private renderHost<T extends DrxHost>(parent: Node, type: NodeType, create: (root: ShadowRoot) => T, render: (host: T) => void, buildContexts: (host: T) => ContextValue[] = () => []): DrxView {
        const element = DrxDom.createHost(parent, type) as HTMLElement;
        const root = element.attachShadow({ mode: 'open' });
        return new DrxView(element, () => {
            const host = create(root);
            Signal.cleanup(() => host.instance?.onUnmount?.());
            Context.use(
                [
                    DrxRenderContext.host.as(host),
                    DrxRenderContext.locals.as(host.locals),
                    ...buildContexts(host)
                ],
                () => {
                    DrxDocumentStyles.mirror(root);
                    render(host);
                    if (this.options.styles) root.adoptedStyleSheets = [...root.adoptedStyleSheets, ...this.options.styles.map(style => DrxStyleSheet.create(root.ownerDocument.defaultView, style))];
                }
            );
            host.instance?.onMount?.();
        });
    }

    private renderComponent(parent: Node, id: string, componentInstance?: DrxComponentInstance): DrxView {
        return this.renderHost(
            parent,
            NodeType.ComponentInstance,
            root => {
                const host: DrxComponentHost = {
                    type: NodeType.Component,
                    component: this.root.state.value.components[id],
                    scope: { type: 'component', componentId: id },
                    componentInstance,
                    parent: DrxRenderContext.component(),
                    parentLocals: DrxRenderContext.locals(),
                    root,
                    locals: {},
                    variables: new Map(),
                    properties: new Map(),
                    services: new Map()
                };
                const state = this.root.state.value;
                const scope = host.scope;
                const attribute = (name: string) => Object.entries(componentInstance?.attributes ?? {}).find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1];
                const events: Record<string, { emit(value?: unknown): void }> = {};
                const inputs: Record<string, any> = {};
                for (const eventId of host.component.eventIds) {
                    const event = state.componentEvents[eventId];
                    const handler = attribute(event.name);
                    events[event.name] = {
                        emit: value => {
                            if (handler != null) this.expression.invoke(handler, { ...host.parentLocals, event: value });
                        }
                    };
                    inputs[event.name] = (value?: unknown) => events[event.name].emit(value);
                }
                for (const propertyId of host.component.propertyIds) {
                    const property = state.componentProperties[propertyId];
                    const value = new State<any>();
                    host.properties.set(property.name, value);
                    inputs[property.name] = value.signal.proxy;
                    const source = attribute(property.name);
                    if (source != null) this.expression.bind(source, host.parentLocals, resolved => value.set(resolved));
                }
                const parentId = DrxComponent.getChain(state, host.component.id)[1]?.id;
                let enclosing: DrxComponentHost | undefined;
                for (let candidate = host.parent; candidate && parentId; candidate = candidate.parent) {
                    if (candidate.component.id === parentId) {
                        enclosing = candidate;
                        break;
                    }
                }
                const dependencies = this.getInstance(state.components[id].library).dependencies;
                const variables = host.component.variableIds.map(id => state.variables[id]);
                host.apis = { ...enclosing?.apis, ...DrxScripting.createApiClients(state, scope, this.realm) };
                host.serviceApis = { ...enclosing?.serviceApis, ...DrxScripting.instantiateServices(state, host.component.serviceIds, scope, this.loadScripts(), host.services, this.realm, dependencies.api) };
                const locals = { ...enclosing?.locals, ...dependencies.locals, asset: this.createAssetLocals(host.component.assetIds, enclosing?.locals.asset) };
                host.props = { ...enclosing?.props, ...Object.fromEntries(Array.from(host.properties, ([name, value]) => [name, () => value.value])) };
                host.events = { ...enclosing?.events, ...events };
                this.instantiateHost(host, host.component.id, DrxScripting.instantiateVariables(variables), locals, () => {
                    host.variableApis = { ...enclosing?.variableApis, ...DrxScripting.createVariableApis(state, variables, host.variables, scope) };
                    return {
                        component: {
                            variables: host.variableApis,
                            props: host.props,
                            events: host.events,
                            root: host.root
                        },
                        apis: host.apis,
                        services: host.serviceApis,
                        libraries: dependencies.api
                    };
                }, inputs);
                return host;
            },
            host => {
                DrxStyleSheet.adopt(host.root, () => this.expression.parse(this.proxy.components[id].style() ?? '', host.locals));
                DrxStyleSheet.registerDocumentRules(host.root.ownerDocument, id, () => this.expression.parse(this.proxy.components[id].style() ?? '', host.locals));
                this.renderTemplate(host.root, () => this.proxy.components[id].template());
            },
            host => [DrxRenderContext.component.as(host)]
        );
    }

    private instantiateHost(host: DrxHost, id: string, variables: DrxDocumentInstance['variables'], locals: Record<string, any>, api: () => object, inputs: Record<string, any> = {}): void {
        host.variables = variables.states;
        const Script = DrxScripting.instantiate(this.loadScripts(), id, api());
        host.instance = Script ? new Script() : undefined;
        host.locals = { ...locals, ...DrxScripting.getFunctionLocals(host.instance), ...variables.locals, ...inputs };
    }

    private createPagesApi(application: DrxApplicationHost): Record<string, any> {
        const state = this.root.state.value;
        const api: Record<string, any> = {};
        for (const id of application.app.pageIds) {
            api[state.pages[id].name] = {
                showModal: (options: { data?: any } = {}) => DrxModalManager.open(application.root.ownerDocument, (host, modal) => {
                    Context.use(
                        [
                            DrxRenderContext.host.as(application),
                            DrxRenderContext.application.as(application),
                            DrxRenderContext.locals.as({ ...application.locals, modal })
                        ],
                        () => this.renderTemplate(host, () => [{ type: NodeType.Page, id }])
                    );
                }, options)
            };
        }
        return api;
    }

    private createAssetLocals(assetIds: string[], fallback?: Record<string, string>): Record<string, string> {
        const assets = assetIds.map(id => this.root.state.value.assets[id]);
        return new Proxy({} as Record<string, string>, {
            get: (_, name) => {
                const asset = typeof name === 'string' ? assets.find(asset => asset.name === name) : undefined;
                if (!asset) return typeof name === 'string' ? fallback?.[name] : undefined;
                if (asset.source.type === 'external') {
                    const path = DrxAsset.getFilePath(asset);
                    return path ? this.root.getFileUrl(path, asset.library) : asset.source.url;
                }
                return DrxAsset.createUrl(asset.source.content ?? '', asset.source.mimeType ?? 'application/octet-stream');
            }
        });
    }

}
