import { DependencyTree } from '@vorplex/compiler';
import { $Id, Scope, Signal } from '@vorplex/core';
import { DrxDocumentState } from '../drx';
import { DrxDom } from '../drx-dom';
import { PreviewContext } from '../preview-context';
import { AppRenderContext, RenderContextType } from '../render-context';
import { DrxScripting } from '../scripting';
import { StyleSheet } from '../style-sheet';
import { DrxApi } from './api/api';
import { DrxAsset } from './asset';
import { DrxComponent } from './component/component';
import { DrxDependencyTree } from './dependency-tree';
import { NodeType } from './node-type';
import { DrxPackages } from './packages';
import { DrxPage } from './page';
import { DrxPwaMetadata } from './pwa-metadata';
import { DrxRouter } from './router';
import { DrxService } from './service';
import { DrxTemplate, DrxTemplateItem } from './template-item';
import { DrxType } from './type';
import { DrxVariable } from './variable';

export interface DrxApp {
    id: string;
    name?: string;
    script?: string;
    style?: string;
    packages?: Record<string, string>;
    dependencyTree?: DependencyTree;
    pwaMetadata?: DrxPwaMetadata;
    pageIds: string[];
    variableIds: string[];
    serviceIds: string[];
    assetIds: string[];
    componentIds: string[];
    typeIds: string[];
    apiIds: string[];
    template: DrxTemplateItem[];
}

export const DrxApp = {
    from(document: HTMLDocument, state: DrxDocumentState): DrxApp {
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
            pwaMetadata: DrxPwaMetadata.from(element),
            pageIds: pages.map(page => page.id),
            variableIds: variables.map(variable => variable.id),
            serviceIds: services.map(service => service.id),
            assetIds: assets.map(asset => asset.id),
            componentIds: components.map(component => component.id),
            typeIds: types.map(type => type.id),
            apiIds: apis.map(api => api.id),
            template: DrxTemplate.from(element, state)
        };
    },
    to(app: DrxApp, state: DrxDocumentState): Element {
        const element = document.createElement(NodeType.App);
        DrxDom.setAttribute(element, 'id', app.id);
        if (app.name) DrxDom.setAttribute(element, 'name', app.name);
        if (app.packages) element.appendChild(DrxPackages.to(app.packages));
        if (app.dependencyTree) element.appendChild(DrxDependencyTree.to(app.dependencyTree));
        if (app.pwaMetadata) element.appendChild(DrxPwaMetadata.to(app.pwaMetadata));
        DrxDom.createScript(element, app.script);
        DrxDom.createStyle(element, app.style);
        for (const id of app.typeIds) element.appendChild(DrxType.to(state.types[id]));
        for (const id of app.variableIds) element.appendChild(DrxVariable.to(state.variables[id]));
        for (const id of app.serviceIds) element.appendChild(DrxService.to(state.services[id]));
        for (const id of app.assetIds) element.appendChild(DrxAsset.to(state.assets[id]));
        for (const id of app.apiIds) element.appendChild(DrxApi.to(state.apis[id], state));
        for (const id of app.componentIds) element.appendChild(DrxComponent.to(state.components[id], state));
        for (const id of app.pageIds) element.appendChild(DrxPage.to(state.pages[id], state));
        for (const child of DrxTemplate.to(app.template, state)) element.appendChild(child);
        return element;
    },
    mount(container: Node, app: DrxApp, state: DrxDocumentState, bundle: string): Scope {
        return Signal.root(() => {
            const view = container.ownerDocument.defaultView;
            const router = DrxRouter.mount(view);
            StyleSheet.adopt(container.ownerDocument, () => app.style);
            const variables = app.variableIds.map(id => state.variables[id]);
            const { locals: variableLocals, states: variableStates } = DrxVariable.instantiate(variables);
            const appContext: AppRenderContext = {
                type: RenderContextType.App,
                nearest: {},
                locals: {
                    asset: DrxAsset.toLocal(app.assetIds, state),
                    ...variableLocals,
                    router
                },
                state,
                bundle,
                app,
                variableStates,
                serviceInstances: new Map(),
                router
            };
            appContext.nearest = { app: appContext };

            const appDrx = {
                app: {
                    variables: DrxVariable.createApi(variables, variableStates, { type: 'app' }, state)
                },
                apis: DrxApi.createApi(app.apiIds, state, { type: 'app' }),
                services: DrxScripting.instantiateServices(app.serviceIds, state, bundle, appContext.serviceInstances),
                router: DrxRouter.createApi(view, router.route),
                pages: DrxPage.createApi(app.pageIds, appContext)
            };
            const AppClass = DrxScripting.instantiate(bundle, app.id, appDrx);
            const instance = AppClass ? new AppClass() : undefined;
            appContext.instance = instance;

            DrxTemplate.mount(container, app.template, appContext);
            instance?.onMount?.();
            Signal.cleanup(() => instance?.onUnmount?.());
        });
    },
    preview(container: Node, context: PreviewContext): Scope {
        return Signal.scope(() => {
            const host = document.createElement(NodeType.App);
            host.style.display = 'contents';
            container.appendChild(host);
            StyleSheet.adopt(host.ownerDocument, () => context.root.proxy.app.style(), ...context.styleSheets);
            DrxTemplate.preview(host, () => context.root.proxy.app.template(), context);
            Signal.cleanup(() => host.remove());
        });
    }
};
