import { $Array, Awaitable, EntityAdaptor, EntityMap, Getter, Scope, Signal, State, TsonDefinition } from '@vorplex/core';
import { IconSheet } from './icon-sheet';
import { ImportResolver } from './import-resolver';
import { ShtmlApi } from './node/api/api';
import { ShtmlApiBody } from './node/api/body';
import { ShtmlApiEndpoint } from './node/api/endpoint';
import { ShtmlApiHeader } from './node/api/header';
import { ShtmlApiParameter } from './node/api/parameter';
import { ShtmlApiResponse } from './node/api/response';
import { ShtmlApp } from './node/app';
import { ShtmlAsset } from './node/asset';
import { ShtmlComponent } from './node/component/component';
import { ShtmlComponentEvent } from './node/component/event';
import { ShtmlComponentInstance } from './node/component/instance';
import { ShtmlComponentProperty } from './node/component/property';
import { ShtmlElement } from './node/element';
import { ShtmlFor } from './node/for';
import { ShtmlIcon } from './node/icon';
import { ShtmlIf } from './node/if';
import { NodeType } from './node/node-type';
import { ShtmlPage } from './node/page';
import { ShtmlPageContainer } from './node/page-container';
import { ShtmlService } from './node/service';
import { ShtmlTemplateItem, ShtmlTemplateNode, ShtmlTemplateTargetType } from './node/template-item';
import { ShtmlText } from './node/text';
import { ShtmlType } from './node/type';
import { ShtmlVariable } from './node/variable';
import { PreviewContext } from './preview-context';
import { ScriptCompiler } from './script-compiler';
import { StyleSheet } from './style-sheet';

export interface ShtmlDocumentState {
    app: ShtmlApp;
    pages: EntityMap<ShtmlPage>;
    variables: EntityMap<ShtmlVariable>;
    services: EntityMap<ShtmlService>;
    assets: EntityMap<ShtmlAsset>;
    components: EntityMap<ShtmlComponent>;
    types: EntityMap<ShtmlType>;
    elements: EntityMap<ShtmlElement>;
    texts: EntityMap<ShtmlText>;
    ifs: EntityMap<ShtmlIf>;
    fors: EntityMap<ShtmlFor>;
    componentProperties: EntityMap<ShtmlComponentProperty>;
    componentEvents: EntityMap<ShtmlComponentEvent>;
    componentInstances: EntityMap<ShtmlComponentInstance>;
    pageContainers: EntityMap<ShtmlPageContainer>;
    icons: EntityMap<ShtmlIcon>;
    apis: EntityMap<ShtmlApi>;
    apiEndpoints: EntityMap<ShtmlApiEndpoint>;
    apiParameters: EntityMap<ShtmlApiParameter>;
    apiHeaders: EntityMap<ShtmlApiHeader>;
    apiBodies: EntityMap<ShtmlApiBody>;
    apiResponses: EntityMap<ShtmlApiResponse>;
}

export class ShtmlDocument {

    public readonly state: State<ShtmlDocumentState>;

    constructor(state: ShtmlDocumentState) {
        this.state = new State<ShtmlDocumentState>(state);
    }

    public static async fetch(url: string): Promise<ShtmlDocument> {
        const base = url.slice(0, url.lastIndexOf('/') + 1);
        const source = await fetch(url).then(response => response.text());
        return ShtmlDocument.load(source, { import: path => fetch(base + path).then(response => response.text()) });
    }

    public static async load(shtml: string, options: { import: (path: string) => Awaitable<string> }): Promise<ShtmlDocument> {
        const dom = await ImportResolver.resolve(shtml, options.import);
        return ShtmlDocument.parse(dom);
    }

    public static parse(dom: Document): ShtmlDocument {
        const state: ShtmlDocumentState = {
            app: null,
            pages: {},
            variables: {},
            services: {},
            assets: {},
            components: {},
            types: {},
            elements: {},
            texts: {},
            ifs: {},
            fors: {},
            componentProperties: {},
            componentEvents: {},
            componentInstances: {},
            pageContainers: {},
            icons: {},
            apis: {},
            apiEndpoints: {},
            apiParameters: {},
            apiHeaders: {},
            apiBodies: {},
            apiResponses: {}
        };
        return new ShtmlDocument({
            ...state,
            app: ShtmlApp.from(dom, state),
        });
    }

    public toShtml(): string {
        const state = this.state.value;
        return ShtmlApp.to(state.app, state).outerHTML;
    }

    // Files `node` into its own EntityMap bucket and appends a reference to it onto `targetType`/`targetId`'s
    // own template array -- the two things every "add a node to the tree" action needs done atomically.
    public addNode(targetType: ShtmlTemplateTargetType, targetId: string, node: ShtmlTemplateNode): void {
        this.state.set(state => {
            switch (node.type) {
                case NodeType.Element: state = { ...state, elements: EntityAdaptor.create(state.elements, node) }; break;
                case NodeType.If: state = { ...state, ifs: EntityAdaptor.create(state.ifs, node) }; break;
                case NodeType.For: state = { ...state, fors: EntityAdaptor.create(state.fors, node) }; break;
                case NodeType.ComponentInstance: state = { ...state, componentInstances: EntityAdaptor.create(state.componentInstances, node) }; break;
                case NodeType.PageContainer: state = { ...state, pageContainers: EntityAdaptor.create(state.pageContainers, node) }; break;
                case NodeType.Icon: state = { ...state, icons: EntityAdaptor.create(state.icons, node) }; break;
                case NodeType.Text: state = { ...state, texts: EntityAdaptor.create(state.texts, node) }; break;
            }
            const reference: ShtmlTemplateItem = { id: node.id, type: node.type };
            switch (targetType) {
                case NodeType.Page: return { ...state, pages: EntityAdaptor.updateById(state.pages, targetId, page => ({ template: [...page.template, reference] })) };
                case NodeType.Component: return { ...state, components: EntityAdaptor.updateById(state.components, targetId, item => ({ template: [...item.template, reference] })) };
                case NodeType.Element: return { ...state, elements: EntityAdaptor.updateById(state.elements, targetId, item => ({ template: [...item.template, reference] })) };
                case NodeType.If: return { ...state, ifs: EntityAdaptor.updateById(state.ifs, targetId, item => ({ template: [...item.template, reference] })) };
                case NodeType.For: return { ...state, fors: EntityAdaptor.updateById(state.fors, targetId, item => ({ template: [...item.template, reference] })) };
            }
        });
    }

    // Strips `node`'s reference out of `targetType`/`targetId`'s own template array and deletes its entity --
    // doesn't walk into `node`'s own descendants, so any entities they reference are left behind unreferenced
    // (inert, same as an orphaned variable/service elsewhere in this app).
    public removeNode(targetType: ShtmlTemplateTargetType, targetId: string, node: ShtmlTemplateItem): void {
        this.state.set(state => {
            switch (targetType) {
                case NodeType.Page: state = { ...state, pages: EntityAdaptor.updateById(state.pages, targetId, page => ({ template: $Array.removeWhere(page.template, entry => entry.id === node.id, true) })) }; break;
                case NodeType.Component: state = { ...state, components: EntityAdaptor.updateById(state.components, targetId, item => ({ template: $Array.removeWhere(item.template, entry => entry.id === node.id, true) })) }; break;
                case NodeType.Element: state = { ...state, elements: EntityAdaptor.updateById(state.elements, targetId, item => ({ template: $Array.removeWhere(item.template, entry => entry.id === node.id, true) })) }; break;
                case NodeType.If: state = { ...state, ifs: EntityAdaptor.updateById(state.ifs, targetId, item => ({ template: $Array.removeWhere(item.template, entry => entry.id === node.id, true) })) }; break;
                case NodeType.For: state = { ...state, fors: EntityAdaptor.updateById(state.fors, targetId, item => ({ template: $Array.removeWhere(item.template, entry => entry.id === node.id, true) })) }; break;
            }
            switch (node.type) {
                case NodeType.Element: return { ...state, elements: EntityAdaptor.delete(state.elements, node.id) };
                case NodeType.If: return { ...state, ifs: EntityAdaptor.delete(state.ifs, node.id) };
                case NodeType.For: return { ...state, fors: EntityAdaptor.delete(state.fors, node.id) };
                case NodeType.ComponentInstance: return { ...state, componentInstances: EntityAdaptor.delete(state.componentInstances, node.id) };
                case NodeType.PageContainer: return { ...state, pageContainers: EntityAdaptor.delete(state.pageContainers, node.id) };
                case NodeType.Icon: return { ...state, icons: EntityAdaptor.delete(state.icons, node.id) };
                case NodeType.Text: return { ...state, texts: EntityAdaptor.delete(state.texts, node.id) };
                default: return state;
            }
        });
    }

    // Nothing in ShtmlDocumentState stores a back-reference, so finding `id`'s owner means searching every
    // place a reference to it could live: the app's own pageIds/componentIds, every page/component's template,
    // and every element/if/for's template, plus every component's nested componentIds. Returns undefined for
    // ids with no owner in any of those (root app, or a kind -- Route, Param, etc -- that never appears as a
    // reference in the first place).
    public getNodeParent(id: string): { type: NodeType; id: string } | undefined {
        const state = this.state.value;
        if (state.app.pageIds.includes(id) || state.app.componentIds.includes(id)) return { type: NodeType.App, id: state.app.id };
        const references = (template: ShtmlTemplateItem[]) => template.some(item => item.id === id);
        for (const page of Object.values(state.pages)) if (references(page.template)) return { type: NodeType.Page, id: page.id };
        for (const component of Object.values(state.components)) {
            if (references(component.template) || component.componentIds.includes(id)) return { type: NodeType.Component, id: component.id };
        }
        for (const element of Object.values(state.elements)) if (references(element.template)) return { type: NodeType.Element, id: element.id };
        for (const item of Object.values(state.ifs)) if (references(item.template)) return { type: NodeType.If, id: item.id };
        for (const item of Object.values(state.fors)) if (references(item.template)) return { type: NodeType.For, id: item.id };
        return undefined;
    }

    // Walks up from `id` through successive getNodeParent() calls until it finds an ancestor of `type` (e.g.
    // the nearest enclosing <x-for>) -- undefined if none exists before reaching the app root.
    public getNodeParentOfType(id: string, type: NodeType): { type: NodeType; id: string } | undefined {
        let current = this.getNodeParent(id);
        while (current) {
            if (current.type === type) return current;
            if (current.type === NodeType.App) return undefined;
            current = this.getNodeParent(current.id);
        }
        return undefined;
    }

    public async mount(target: Element): Promise<Scope> {
        const state = this.state.value;
        IconSheet.load();
        const compiled = await ScriptCompiler.compile(state);
        return ShtmlApp.mount(target, state.app, state, compiled);
    }

    public async preview(container: Element, options: { target: { type: 'page' | 'component', id: string }, resolveAsset?: (asset: ShtmlAsset) => string, styleSheets?: Getter<string | undefined>[] }): Promise<{ dispose: () => void }> {
        IconSheet.load();
        const scope = Signal.root(() => {
            const context: PreviewContext = {
                root: this.state.signal,
                resolveAsset: options.resolveAsset,
                styleSheets: (options.styleSheets ?? []).map(css => StyleSheet.create(container.ownerDocument.defaultView, css))
            };
            if (options.target.type === 'component') {
                ShtmlComponent.preview(container, options.target.id, context);
            } else {
                ShtmlPage.preview(container, options.target.id, context);
            }
        });
        return { dispose: () => scope.dispose() };
    }

    public getLocals(targetId: string): Record<string, TsonDefinition> {
        const proxy = this.state.signal.proxy;
        const app = proxy.app;

        const walkTemplate = (template: ShtmlTemplateItem[], forLocals: [string, TsonDefinition][]): [string, TsonDefinition][] | undefined => {
            for (const item of template) {
                if (item.id === targetId) return forLocals;
                if (item.type === NodeType.Element) {
                    const found = walkTemplate(proxy.elements[item.id].template(), forLocals);
                    if (found) return found;
                } else if (item.type === NodeType.If) {
                    const found = walkTemplate(proxy.ifs[item.id].template(), forLocals);
                    if (found) return found;
                } else if (item.type === NodeType.For) {
                    const forNode = proxy.fors[item.id];
                    const added: [string, TsonDefinition][] = [[forNode.as() || 'item', { type: 'any' }]];
                    if (forNode.index()) added.push([forNode.index(), { type: 'any' }]);
                    if (forNode.key()) added.push([forNode.key(), { type: 'any' }]);
                    const found = walkTemplate(forNode.template(), [...forLocals, ...added]);
                    if (found) return found;
                }
            }
            return undefined;
        };

        const resolveTypes = (typeIds: string[]): ShtmlType[] =>
            typeIds.map(id => ({ id: proxy.types[id].id(), name: proxy.types[id].name(), type: proxy.types[id].type() }));

        const resolveVariables = (variableIds: string[], types: ShtmlType[]): [string, TsonDefinition][] =>
            variableIds.map(id => [proxy.variables[id].name(), ShtmlType.resolve(proxy.variables[id].type(), types)]);

        for (const pageId of app.pageIds()) {
            const page = proxy.pages[pageId];
            const forLocals = walkTemplate(page.template(), []);
            if (!forLocals) continue;
            const types = resolveTypes(app.typeIds());
            const reserved: [string, TsonDefinition][] = [['asset', { type: 'any' }], ['modal', { type: 'any' }]];
            if (app.router()) reserved.push(['router', { type: 'any' }]);
            return Object.fromEntries([
                ...resolveVariables(app.variableIds(), types),
                ...resolveVariables(page.variableIds(), types),
                ...forLocals,
                ...reserved
            ]);
        }

        const findInComponents = (componentIds: string[]): Record<string, TsonDefinition> | undefined => {
            for (const componentId of componentIds) {
                const component = proxy.components[componentId];
                const forLocals = walkTemplate(component.template(), []);
                if (forLocals) {
                    const types = resolveTypes(component.typeIds());
                    const propertyLocals: [string, TsonDefinition][] = component.propertyIds()
                        .map(id => [proxy.componentProperties[id].name(), ShtmlType.resolve(proxy.componentProperties[id].type(), types)]);
                    return Object.fromEntries([
                        ...resolveVariables(component.variableIds(), types),
                        ...propertyLocals,
                        ...forLocals,
                        ['asset', { type: 'any' }]
                    ]);
                }
                const nested = findInComponents(component.componentIds());
                if (nested) return nested;
            }
            return undefined;
        };

        return findInComponents(app.componentIds()) ?? {};
    }

}
