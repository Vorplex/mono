import { $Id, Scope, Signal, State } from '@vorplex/core';
import { modalApi } from '../modal-manager';
import { AppRenderContext, RenderContextType, RouterState } from '../render-context';
import { CompiledScripts, ScriptCompiler } from '../script-compiler';
import { ShtmlDocumentState } from '../shtml';
import { ShtmlDom } from '../shtml-dom';
import { ShtmlApi } from './api/api';
import { ShtmlAsset } from './asset';
import { ShtmlComponent } from './component/component';
import { ShtmlType } from './type';
import { NodeType } from './node-type';
import { ShtmlPackages } from './packages';
import { ShtmlPage } from './page';
import { ShtmlRouter } from './router';
import { ShtmlService } from './service';
import { ShtmlVariable } from './variable';

export interface ShtmlApp {
    id: string;
    name?: string;
    script?: string;
    style?: string;
    packages?: Record<string, string>;
    pageIds: string[];
    variableIds: string[];
    serviceIds: string[];
    router?: ShtmlRouter;
    assetIds: string[];
    componentIds: string[];
    typeIds: string[];
    apiIds: string[];
}

export const ShtmlApp = {
    from(document: HTMLDocument, state: ShtmlDocumentState): ShtmlApp {
        // 'text/html' parsing always nests content under <body>, even for a bare <x-app>...</x-app> source
        // with no explicit <html>/<body> wrapper -- so <x-app> is never a direct child of the document itself.
        const element = document.body.querySelector(`:scope > ${NodeType.App}`);
        return ShtmlApp.parse(element, state);
    },
    parse(element: Element, state: ShtmlDocumentState): ShtmlApp {
        const pages = ShtmlPage.from(element, state);
        const variables = ShtmlVariable.from(element, state);
        const services = ShtmlService.from(element, state);
        const assets = ShtmlAsset.from(element, state);
        const components = ShtmlComponent.from(element, state);
        const types = ShtmlType.from(element, state);
        const apis = ShtmlApi.from(element, state);
        return {
            id: ShtmlDom.getAttribute(element, 'id') ?? $Id.guid(),
            name: ShtmlDom.getAttribute(element, 'name'),
            script: ShtmlDom.getScript(element),
            style: ShtmlDom.getStyle(element),
            packages: ShtmlPackages.from(element),
            pageIds: pages.map(page => page.id),
            variableIds: variables.map(variable => variable.id),
            serviceIds: services.map(service => service.id),
            assetIds: assets.map(asset => asset.id),
            componentIds: components.map(component => component.id),
            typeIds: types.map(type => type.id),
            apiIds: apis.map(api => api.id),
            router: ShtmlRouter.from(element)
        };
    },
    to(app: ShtmlApp, state: ShtmlDocumentState): Element {
        const element = document.createElement(NodeType.App);
        element.setAttribute('id', app.id);
        if (app.name) element.setAttribute('name', app.name);
        ShtmlDom.createScript(element, app.script);
        ShtmlDom.createStyle(element, app.style);
        if (app.packages) element.appendChild(ShtmlPackages.to(app.packages));
        if (app.router) element.appendChild(ShtmlRouter.to(app.router));
        for (const id of app.typeIds) element.appendChild(ShtmlType.to(state.types[id]));
        for (const id of app.variableIds) element.appendChild(ShtmlVariable.to(state.variables[id]));
        for (const id of app.serviceIds) element.appendChild(ShtmlService.to(state.services[id]));
        for (const id of app.assetIds) element.appendChild(ShtmlAsset.to(state.assets[id]));
        for (const id of app.apiIds) element.appendChild(ShtmlApi.to(state.apis[id], state));
        for (const id of app.componentIds) element.appendChild(ShtmlComponent.to(state.components[id], state));
        for (const id of app.pageIds) element.appendChild(ShtmlPage.to(state.pages[id], state));
        return element;
    },
    mount(container: Node, app: ShtmlApp, state: ShtmlDocumentState, compiled: CompiledScripts): Scope {
        return Signal.scope(() => {
            const variables = app.variableIds.map(id => state.variables[id]);
            const { locals: variableLocals, states: variableStates } = ShtmlVariable.instantiate(variables);
            const routerState = new State<RouterState>({ route: '', params: {} });
            const pages = app.pageIds.map(id => state.pages[id]);
            const currentPage = app.router ? undefined : Signal.create(pages[0]?.name);
            const appContext: AppRenderContext = {
                type: RenderContextType.App,
                nearest: {},
                locals: {
                    asset: ShtmlAsset.toLocal(app.assetIds, state),
                    ...variableLocals
                },
                state,
                compiled,
                app,
                variableStates,
                serviceInstances: new Map(),
                currentPage,
                routerState
            };
            appContext.nearest = { app: appContext };

            const types = app.typeIds.map(id => state.types[id]);
            const appShtml = {
                app: {
                    variables: ShtmlVariable.createApi(variables, variableStates, types),
                    get instance() { return appContext.instance; }
                },
                apis: ShtmlApi.createApi(app.apiIds, state, types),
                services: ScriptCompiler.instantiateServices(app.serviceIds, state, compiled, appContext.serviceInstances),
                router: ShtmlRouter.createApi(container.ownerDocument.defaultView, routerState),
                pages: ShtmlPage.createApi(app.pageIds, appContext),
                modal: modalApi
            };
            const AppClass = ScriptCompiler.instantiate(compiled, app.id, appShtml);
            const instance = AppClass ? new AppClass() : undefined;
            appContext.instance = instance;

            if (app.router) {
                ShtmlRouter.mount(container, app.router, appContext);
            } else {
                Signal.effect(() => {
                    const name = currentPage!();
                    const page = pages.find(page => page.name === name);
                    if (!page) throw new Error(`Unknown page "${name}"`);
                    ShtmlPage.mount(container, page, appContext);
                });
            }
            instance?.onMount?.();
            Signal.cleanup(() => instance?.onUnmount?.());
        });
    }
};
