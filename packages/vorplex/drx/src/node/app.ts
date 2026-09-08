import { DependencyTree } from '@vorplex/compiler';
import { $Id, Scope, Signal, State } from '@vorplex/core';
import { modalApi } from '../modal-manager';
import { AppRenderContext, RenderContextType, RouterState } from '../render-context';
import { CompiledScripts, ScriptCompiler } from '../script-compiler';
import { DrxDocumentState } from '../drx';
import { DrxDom } from '../drx-dom';
import { DrxApi } from './api/api';
import { DrxAsset } from './asset';
import { DrxComponent } from './component/component';
import { DrxType } from './type';
import { DrxDependencyTree } from './dependency-tree';
import { NodeType } from './node-type';
import { DrxPackages } from './packages';
import { DrxPage } from './page';
import { DrxRouter } from './router';
import { DrxService } from './service';
import { DrxVariable } from './variable';

export interface DrxApp {
    id: string;
    name?: string;
    script?: string;
    style?: string;
    packages?: Record<string, string>;
    dependencyTree?: DependencyTree;
    pageIds: string[];
    variableIds: string[];
    serviceIds: string[];
    router?: DrxRouter;
    assetIds: string[];
    componentIds: string[];
    typeIds: string[];
    apiIds: string[];
}

export const DrxApp = {
    from(document: HTMLDocument, state: DrxDocumentState): DrxApp {
        // 'text/html' parsing always nests content under <body>, even for a bare <x-app>...</x-app> source
        // with no explicit <html>/<body> wrapper -- so <x-app> is never a direct child of the document itself.
        const element = document.body.querySelector(`:scope > ${NodeType.App}`);
        return DrxApp.parse(element, state);
    },
    parse(element: Element, state: DrxDocumentState): DrxApp {
        const pages = DrxPage.from(element, state);
        const variables = DrxVariable.from(element, state);
        const services = DrxService.from(element, state);
        const assets = DrxAsset.from(element, state);
        const components = DrxComponent.from(element, state);
        const types = DrxType.from(element, state);
        const apis = DrxApi.from(element, state);
        return {
            id: DrxDom.getAttribute(element, 'id') ?? $Id.guid(),
            name: DrxDom.getAttribute(element, 'name'),
            script: DrxDom.getScript(element),
            style: DrxDom.getStyle(element),
            packages: DrxPackages.from(element),
            dependencyTree: DrxDependencyTree.from(element),
            pageIds: pages.map(page => page.id),
            variableIds: variables.map(variable => variable.id),
            serviceIds: services.map(service => service.id),
            assetIds: assets.map(asset => asset.id),
            componentIds: components.map(component => component.id),
            typeIds: types.map(type => type.id),
            apiIds: apis.map(api => api.id),
            router: DrxRouter.from(element)
        };
    },
    to(app: DrxApp, state: DrxDocumentState): Element {
        const element = document.createElement(NodeType.App);
        DrxDom.setAttribute(element, 'id', app.id);
        if (app.name) DrxDom.setAttribute(element, 'name', app.name);
        if (app.packages) element.appendChild(DrxPackages.to(app.packages));
        if (app.dependencyTree) element.appendChild(DrxDependencyTree.to(app.dependencyTree));
        DrxDom.createScript(element, app.script);
        DrxDom.createStyle(element, app.style);
        if (app.router) element.appendChild(DrxRouter.to(app.router));
        for (const id of app.typeIds) element.appendChild(DrxType.to(state.types[id]));
        for (const id of app.variableIds) element.appendChild(DrxVariable.to(state.variables[id]));
        for (const id of app.serviceIds) element.appendChild(DrxService.to(state.services[id]));
        for (const id of app.assetIds) element.appendChild(DrxAsset.to(state.assets[id]));
        for (const id of app.apiIds) element.appendChild(DrxApi.to(state.apis[id], state));
        for (const id of app.componentIds) element.appendChild(DrxComponent.to(state.components[id], state));
        for (const id of app.pageIds) element.appendChild(DrxPage.to(state.pages[id], state));
        return element;
    },
    mount(container: Node, app: DrxApp, state: DrxDocumentState, compiled: CompiledScripts): Scope {
        return Signal.root(() => {
            const variables = app.variableIds.map(id => state.variables[id]);
            const { locals: variableLocals, states: variableStates } = DrxVariable.instantiate(variables);
            const routerState = new State<RouterState>({ route: '', params: {} });
            const pages = app.pageIds.map(id => state.pages[id]);
            const currentPage = app.router ? undefined : Signal.create(pages[0]?.name);
            const appContext: AppRenderContext = {
                type: RenderContextType.App,
                nearest: {},
                locals: {
                    asset: DrxAsset.toLocal(app.assetIds, state),
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

            const appDrx = {
                app: {
                    variables: DrxVariable.createApi(variables, variableStates, { type: 'app' }, state),
                    get instance() { return appContext.instance; }
                },
                apis: DrxApi.createApi(app.apiIds, state, { type: 'app' }),
                services: ScriptCompiler.instantiateServices(app.serviceIds, state, compiled, appContext.serviceInstances),
                router: DrxRouter.createApi(container.ownerDocument.defaultView, routerState),
                pages: DrxPage.createApi(app.pageIds, appContext),
                modal: modalApi
            };
            const AppClass = ScriptCompiler.instantiate(compiled, app.id, appDrx);
            const instance = AppClass ? new AppClass() : undefined;
            appContext.instance = instance;

            if (app.router) {
                DrxRouter.mount(container, app.router, appContext);
            } else {
                Signal.effect(() => {
                    const name = currentPage!();
                    const page = pages.find(page => page.name === name);
                    if (!page) throw new Error(`Unknown page "${name}"`);
                    DrxPage.mount(container, page, appContext);
                });
            }
            instance?.onMount?.();
            Signal.cleanup(() => instance?.onUnmount?.());
        });
    }
};
