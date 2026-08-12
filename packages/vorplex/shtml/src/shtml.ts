import { Awaitable, EntityMap, Getter, Scope, Signal, State, TsonDefinition } from '@vorplex/core';
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
import { ShtmlType } from './node/type';
import { ShtmlElement } from './node/element';
import { ShtmlFor } from './node/for';
import { ShtmlIcon } from './node/icon';
import { ShtmlIf } from './node/if';
import { NodeType } from './node/node-type';
import { ShtmlPage } from './node/page';
import { ShtmlPageContainer } from './node/page-container';
import { ShtmlService } from './node/service';
import { ShtmlTemplateItem } from './node/template-item';
import { ShtmlText } from './node/text';
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
    properties: EntityMap<ShtmlComponentProperty>;
    events: EntityMap<ShtmlComponentEvent>;
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
            properties: {},
            events: {},
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

    public async mount(target: Element): Promise<Scope> {
        const state = this.state.value;
        const [compiled] = await Promise.all([
            ScriptCompiler.compile(state),
            IconSheet.load()
        ]);
        return ShtmlApp.mount(target, state.app, state, compiled);
    }

    public async preview(container: Element, options: { target: { type: 'page' | 'component', id: string }, resolveAsset?: (asset: ShtmlAsset) => string, styleSheets?: Getter<string | undefined>[] }): Promise<{ dispose: () => void }> {
        await IconSheet.load();
        const scope = Signal.scope(() => {
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
                if (item.kind === NodeType.Element) {
                    const found = walkTemplate(proxy.elements[item.id].template(), forLocals);
                    if (found) return found;
                } else if (item.kind === NodeType.If) {
                    const found = walkTemplate(proxy.ifs[item.id].template(), forLocals);
                    if (found) return found;
                } else if (item.kind === NodeType.For) {
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
                        .map(id => [proxy.properties[id].name(), ShtmlType.resolve(proxy.properties[id].type(), types)]);
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
