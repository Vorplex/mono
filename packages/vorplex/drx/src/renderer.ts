import { $Path, $Value, Context, ContextValue, Getter, Scope, Signal, State } from '@vorplex/core';
import { $Element } from '@vorplex/web';
import type { DrxDocumentState } from './document';
import { DrxDocumentStyles } from './document-styles';
import { DrxDom } from './dom';
import { DrxExpression } from './expression';
import { DrxIconSheet } from './icon-sheet';
import { DrxModalManager } from './modal-manager';
import { DrxComponent } from './node/component/component';
import { NodeType } from './node/node-type';
import { DrxTemplateItem } from './node/template-item';
import { DrxVariable } from './node/variable';
import { DrxApplicationHost, DrxComponentHost, DrxHost, DrxPageHost, DrxRenderContext } from './render-context';
import { DrxRouter } from './router';
import { DrxScripting } from './scripting';
import { DrxStyleSheet } from './style-sheet';
import { DrxView } from './view';

export interface DrxRendererOptions {
    bundle?: string;
    expression?: DrxExpression;
}

export interface DrxRenderTarget {
    type: 'app' | 'page' | 'component';
    id: string;
}

export class DrxRenderer {

    private static readonly assetUrls = new Map<string, string>();
    protected readonly bundle?: string;
    protected expression: DrxExpression;
    protected realm: typeof globalThis;
    private scripts?: Record<string, any>;

    constructor(public readonly state: Signal<DrxDocumentState>, options: DrxRendererOptions = {}) {
        this.bundle = options.bundle;
        this.expression = options.expression;
    }

    protected loadScripts(): Record<string, any> | undefined {
        return this.scripts ??= DrxScripting.load(this.bundle, this.realm);
    }

    public render(parent: Node, target?: DrxRenderTarget): Scope {
        this.realm = parent.ownerDocument.defaultView;
        this.expression ??= new DrxExpression(this.realm);
        return Signal.root(() => {
            DrxIconSheet.load();
            const template = target && target.type !== 'app'
                ? [{ type: target.type === 'page' ? NodeType.Page : NodeType.Component, id: target.id }]
                : undefined;
            const output = this.renderApplication(parent, template);
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
                    output = this.renderNode(parent, item);
                    const rendered = output;
                    Signal.cleanup(() => rendered?.dispose());
                    rendered?.mount(parent, anchor);
                } catch (error) {
                    output = null;
                    const host = DrxRenderContext.host();
                    const node = item.type === NodeType.Element ? this.state.value.elements[item.id].tag : item.type === NodeType.Text ? 'text()' : item.type.toLowerCase();
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

    protected renderNode(parent: Node, item: DrxTemplateItem): DrxView | null {
        switch (item.type) {
            case NodeType.Text: return this.renderText(parent, item);
            case NodeType.Element: return this.renderElement(parent, item);
            case NodeType.Icon: return this.renderIcon(parent, item);
            case NodeType.If: return this.renderIf(parent, item);
            case NodeType.ElseIf: return this.renderElseIf(parent, item);
            case NodeType.Else: return this.renderElse(parent, item);
            case NodeType.For: return this.renderFor(parent, item);
            case NodeType.RouterRoute: return this.renderRouterRoute(parent, item);
            case NodeType.PageContainer: return this.renderPageContainer(parent, item);
            case NodeType.ComponentInstance: return this.renderComponentInstance(parent, item);
            case NodeType.Page: return this.renderPage(parent, item.id);
            case NodeType.Component: return this.renderComponent(parent, item.id);
            default: throw new Error(`Unsupported DRX node type "${item.type}"`);
        }
    }

    protected createHost(parent: Node, item: DrxTemplateItem, render: (host: Element) => void): DrxView {
        const host = DrxDom.createHost(parent, item.type);
        return new DrxView(host, () => render(host));
    }

    protected renderText(parent: Node, item: DrxTemplateItem): DrxView {
        const node = parent.ownerDocument.createTextNode('');
        return new DrxView(node, () => Signal.effect(() => {
            const value = this.expression.parse(this.state.proxy.texts[item.id].content(), DrxRenderContext.locals());
            node.textContent = value == null ? '' : String(value);
        }));
    }

    protected renderElement(parent: Node, item: DrxTemplateItem): DrxView {
        const element = DrxDom.createElement(parent, this.state.proxy.elements[item.id].tag());
        return new DrxView(element, () => {
            Signal.effect(() => {
                if (!('html' in this.state.proxy.elements[item.id].attributes())) {
                    this.renderTemplate(element, () => this.state.proxy.elements[item.id].template());
                }
            });
            Signal.effect(() => this.expression.bindAttributes(element, this.state.proxy.elements[item.id].attributes(), DrxRenderContext.locals()));
        });
    }

    protected renderIcon(parent: Node, item: DrxTemplateItem): DrxView {
        const element = parent.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'svg');
        return new DrxView(element, () => {
            Signal.effect(() => this.expression.bindAttributes(element, this.state.proxy.icons[item.id].attributes(), DrxRenderContext.locals()));
            Signal.effect(() => DrxIconSheet.apply(element, this.expression.parse(this.state.proxy.icons[item.id].name(), DrxRenderContext.locals())));
        });
    }

    protected renderIf(parent: Node, item: DrxTemplateItem): DrxView {
        return this.createHost(parent, item, host => Signal.effect(() => {
            const locals = DrxRenderContext.locals();
            const node = this.state.proxy.ifs[item.id]();
            const branches = [node, ...node.branchIds.map(id => this.state.proxy.elseIfs[id]())];
            for (const branch of branches) {
                if (this.expression.evaluate(branch.condition, locals)) {
                    this.renderTemplate(host, () => branch.template);
                    return;
                }
            }
            if (node.elseId) this.renderTemplate(host, () => this.state.proxy.elses[node.elseId].template());
        }));
    }

    protected renderElseIf(parent: Node, item: DrxTemplateItem): DrxView {
        return this.createHost(parent, item, host => this.renderTemplate(host, () => this.state.proxy.elseIfs[item.id].template()));
    }

    protected renderElse(parent: Node, item: DrxTemplateItem): DrxView {
        return this.createHost(parent, item, host => this.renderTemplate(host, () => this.state.proxy.elses[item.id].template()));
    }

    protected renderFor(parent: Node, item: DrxTemplateItem): DrxView {
        return this.createHost(parent, item, host => Signal.effect(() => {
            const locals = DrxRenderContext.locals();
            const node = this.state.proxy.fors[item.id]();
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
                        this.renderTemplate(element, () => this.state.proxy.fors[item.id].template());
                    });
                    return element;
                }
            );
            Signal.effect(() => {
                for (const entry of entries()) host.appendChild(entry);
            });
        }));
    }

    protected renderRouterRoute(parent: Node, item: DrxTemplateItem): DrxView {
        return this.createHost(parent, item, host => Signal.effect(() => {
            const application = DrxRenderContext.application();
            const locals = DrxRenderContext.locals();
            const scope = DrxRenderContext.route();
            const group = scope?.group;
            const node = this.state.proxy.routerRoutes[item.id]();
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
                    () => this.renderTemplate(host, () => this.state.proxy.routerRoutes[item.id].template())
                );
                child.group.ready(true);
            });
        }));
    }

    protected renderPageContainer(parent: Node, item: DrxTemplateItem): DrxView {
        return this.createHost(parent, item, host => Signal.effect(() => {
            const application = DrxRenderContext.application();
            const locals = DrxRenderContext.locals();
            const name = this.expression.parse(this.state.proxy.pageContainers[item.id].page(), locals);
            const pageId = this.state.proxy.app.pageIds().find(id => this.state.proxy.pages[id].name() === name);
            if (!pageId) throw new Error(`Unknown page "${name}"`);
            DrxRenderContext.locals.use({ ...application.locals, router: locals.router }, () => {
                this.renderTemplate(host, () => [{ type: NodeType.Page, id: pageId }]);
            });
        }));
    }

    protected renderComponentInstance(parent: Node, item: DrxTemplateItem): DrxView {
        const instance = this.state.proxy.componentInstances[item.id]();
        const name = this.expression.parse(instance.component, DrxRenderContext.locals());
        const component = this.resolveComponent(name);
        if (!component) throw new Error(`Unknown component "${name}"`);
        return this.renderComponent(parent, component.id, item.id);
    }

    protected resolveComponent(name: string): DrxComponent | undefined {
        const find = (ids: string[]) => this.state.value.components[ids.find(id => this.state.proxy.components[id].name() === name)];
        for (let host = DrxRenderContext.component(); host; host = host.parent) {
            const component = find(this.state.proxy.components[host.component.id].componentIds());
            if (component) return component;
        }
        return find(this.state.proxy.app.componentIds());
    }

    protected renderHost<T extends DrxHost>(parent: Node, type: NodeType, create: (root: ShadowRoot) => T, render: (host: T) => void, buildContexts: (host: T) => ContextValue[] = () => []): DrxView {
        const element = DrxDom.createHost(parent, type) as HTMLElement;
        const root = element.attachShadow({ mode: 'open' });
        return new DrxView(element, () => {
            const host = create(root);
            Signal.cleanup(() => this.unmount(host));
            Context.use(
                [
                    DrxRenderContext.host.as(host),
                    DrxRenderContext.locals.as(host.locals),
                    ...buildContexts(host)
                ],
                () => {
                    DrxDocumentStyles.mirror(root);
                    render(host);
                }
            );
            this.mount(host);
        });
    }

    protected renderApplication(parent: Node, template?: DrxTemplateItem[]): DrxView {
        const group = DrxRouter.createGroup();
        return this.renderHost(
            parent,
            NodeType.App,
            root => {
                const host: DrxApplicationHost = {
                    type: NodeType.App,
                    app: this.state.value.app,
                    root,
                    locals: {},
                    variables: new Map(),
                    services: new Map()
                };
                this.initializeApplication(host);
                return host;
            },
            host => {
                host.style = DrxStyleSheet.create(host.root.ownerDocument.defaultView, () => this.expression.parse(this.state.proxy.app.style() ?? '', host.locals));
                DrxStyleSheet.attach(host.root.ownerDocument, host.style);
                DrxStyleSheet.adopt(host.root, host.style);
                this.renderTemplate(host.root, () => template ?? this.state.proxy.app.template());
                group.ready(true);
            },
            host => [DrxRenderContext.application.as(host), DrxRenderContext.route.as({ group })]
        );
    }

    protected renderPage(parent: Node, id: string): DrxView {
        return this.renderHost(
            parent,
            NodeType.Page,
            root => {
                const host: DrxPageHost = {
                    type: NodeType.Page,
                    page: this.state.value.pages[id],
                    root,
                    locals: { ...DrxRenderContext.locals() },
                    variables: new Map()
                };
                this.initializePage(host);
                return host;
            },
            host => {
                DrxStyleSheet.adopt(host.root, DrxRenderContext.application().style, () => this.expression.parse(this.state.proxy.pages[id].style() ?? '', host.locals));
                DrxStyleSheet.registerDocumentRules(host.root.ownerDocument, id, () => this.expression.parse(this.state.proxy.pages[id].style() ?? '', host.locals));
                this.renderTemplate(host.root, () => this.state.proxy.pages[id].template());
            }
        );
    }

    protected renderComponent(parent: Node, id: string, instanceId?: string): DrxView {
        return this.renderHost(
            parent,
            NodeType.ComponentInstance,
            root => {
                const host: DrxComponentHost = {
                    type: NodeType.Component,
                    component: this.state.value.components[id],
                    instanceId,
                    parent: DrxRenderContext.component(),
                    parentLocals: DrxRenderContext.locals(),
                    root,
                    locals: {},
                    variables: new Map(),
                    properties: new Map(),
                    services: new Map()
                };
                this.initializeComponent(host);
                return host;
            },
            host => {
                DrxStyleSheet.adopt(host.root, () => this.expression.parse(this.state.proxy.components[id].style() ?? '', host.locals));
                DrxStyleSheet.registerDocumentRules(host.root.ownerDocument, id, () => this.expression.parse(this.state.proxy.components[id].style() ?? '', host.locals));
                this.renderTemplate(host.root, () => this.state.proxy.components[id].template());
            },
            host => [DrxRenderContext.component.as(host)]
        );
    }

    protected initializeApplication(host: DrxApplicationHost): void {
        const state = this.state.value;
        const view = host.root.ownerDocument.defaultView;
        host.router = DrxRouter.mount(view);
        this.instantiateHost(host, host.app.id, host.app.variableIds, { asset: this.createAssetLocals(host.app.assetIds), router: host.router }, variables => ({
            app: { variables: DrxScripting.createVariableApis(variables, host.variables, { type: 'app' }, state) },
            apis: DrxScripting.createApiClients(state, { type: 'app' }, this.realm),
            services: DrxScripting.instantiateServices(host.app.serviceIds, state, this.loadScripts(), host.services, { type: 'app' }, this.realm),
            router: DrxRouter.createApi(view, host.router.route),
            pages: this.createPagesApi(host)
        }));
    }

    protected initializePage(host: DrxPageHost): void {
        const state = this.state.value;
        const application = DrxRenderContext.application();
        const view = host.root.ownerDocument.defaultView;
        this.instantiateHost(host, host.page.id, host.page.variableIds, host.locals, variables => ({
            app: {
                variables: DrxScripting.createVariableApis(application.app.variableIds.map(id => state.variables[id]), application.variables, { type: 'app' }, state),
                get instance() { return application.instance; }
            },
            page: { variables: DrxScripting.createVariableApis(variables, host.variables, { type: 'app' }, state), root: host.root },
            apis: DrxScripting.createApiClients(state, { type: 'app' }, this.realm),
            services: DrxScripting.instantiateServices(application.app.serviceIds, state, this.loadScripts(), application.services, { type: 'app' }, this.realm),
            router: DrxRouter.createApi(view, application.router.route, host.locals.router),
            pages: this.createPagesApi(application),
            modal: host.locals.modal
        }));
    }

    protected initializeComponent(host: DrxComponentHost): void {
        const state = this.state.value;
        const scope = { type: 'component', componentId: host.component.id } as const;
        const instance = host.instanceId ? state.componentInstances[host.instanceId] : undefined;
        const attribute = (name: string) => Object.entries(instance?.attributes ?? {}).find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1];
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
        this.instantiateHost(host, host.component.id, host.component.variableIds, { asset: this.createAssetLocals(host.component.assetIds) }, variables => ({
            component: {
                variables: DrxScripting.createVariableApis(variables, host.variables, scope, state),
                props: Object.fromEntries(Array.from(host.properties, ([name, value]) => [name, () => value.value])),
                events,
                root: host.root
            },
            apis: DrxScripting.createApiClients(state, scope, this.realm),
            services: DrxScripting.instantiateServices(host.component.serviceIds, state, this.loadScripts(), host.services, scope, this.realm)
        }), inputs);
    }

    protected instantiateHost(host: DrxHost, id: string, variableIds: string[], locals: Record<string, any>, api: (variables: DrxVariable[]) => object, inputs: Record<string, any> = {}): void {
        const variables = variableIds.map(id => this.state.value.variables[id]);
        const initialized = DrxScripting.instantiateVariables(variables);
        host.variables = initialized.states;
        const Script = DrxScripting.instantiate(this.loadScripts(), id, api(variables));
        host.instance = Script ? new Script() : undefined;
        host.locals = { ...locals, ...DrxScripting.getFunctionLocals(host.instance), ...initialized.locals, ...inputs };
    }

    protected mount(host: DrxHost): void {
        host.instance?.onMount?.();
    }

    protected unmount(host: DrxHost): void {
        host.instance?.onUnmount?.();
    }

    protected createPagesApi(application: DrxApplicationHost): Record<string, any> {
        const api: Record<string, any> = {};
        for (const id of application.app.pageIds) {
            api[this.state.value.pages[id].name] = {
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

    protected createAssetLocals(assetIds: string[]): Record<string, string> {
        const assets = assetIds.map(id => this.state.value.assets[id]);
        return new Proxy({} as Record<string, string>, {
            get: (_, name) => {
                const asset = typeof name === 'string' ? assets.find(asset => asset.name === name) : undefined;
                if (!asset) return undefined;
                if (asset.source.type === 'external') return asset.source.url;
                if (!DrxRenderer.assetUrls.has(asset.id)) DrxRenderer.assetUrls.set(asset.id, URL.createObjectURL(new Blob([asset.source.content ?? ''], { type: asset.source.mimeType ?? 'application/octet-stream' })));
                return DrxRenderer.assetUrls.get(asset.id);
            }
        });
    }

}
