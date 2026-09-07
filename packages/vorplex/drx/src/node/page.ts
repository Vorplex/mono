import { $Id, Scope, Signal } from '@vorplex/core';
import { modalApi, ModalManager } from '../modal-manager';
import { PreviewContext } from '../preview-context';
import { AppRenderContext, PageRenderContext, RenderContext, RenderContextType } from '../render-context';
import { ScriptCompiler } from '../script-compiler';
import { DrxDocumentState } from '../drx';
import { DrxDom } from '../drx-dom';
import { StyleSheet } from '../style-sheet';
import { DrxApi } from './api/api';
import { NodeType } from './node-type';
import { DrxRouter } from './router';
import { DrxTemplate, DrxTemplateItem } from './template-item';
import { DrxVariable } from './variable';

export interface DrxPage {
    id: string;
    name: string;
    script?: string;
    style?: string;
    variableIds: string[];
    template: DrxTemplateItem[];
}

export const DrxPage = {
    from(parent: Element, state: DrxDocumentState): DrxPage[] {
        const elements = Array.from(parent.querySelectorAll(`:scope > ${NodeType.Page}`));
        return elements.map(element => DrxPage.parse(element, state));
    },
    parse(element: Element, state: DrxDocumentState): DrxPage {
        const variables = DrxVariable.from(element, state);
        const page: DrxPage = {
            id: DrxDom.getAttribute(element, 'id') ?? $Id.guid(),
            name: DrxDom.getRequiredAttribute(element, 'name'),
            script: DrxDom.getScript(element),
            style: DrxDom.getStyle(element),
            variableIds: variables.map(variable => variable.id),
            template: DrxTemplate.from(element, state)
        };
        state.pages[page.id] = page;
        return page;
    },
    to(page: DrxPage, state: DrxDocumentState): Element {
        const element = document.createElement(NodeType.Page);
        element.setAttribute('id', page.id);
        element.setAttribute('name', page.name);
        DrxDom.createScript(element, page.script);
        DrxDom.createStyle(element, page.style);
        for (const id of page.variableIds) element.appendChild(DrxVariable.to(state.variables[id]));
        for (const child of DrxTemplate.to(page.template, state)) element.appendChild(child);
        return element;
    },
    mount(container: Node, page: DrxPage, context: RenderContext): Scope {
        return Signal.scope(() => {
            const host = document.createElement(NodeType.Page);
            host.style.display = 'contents';
            container.appendChild(host);
            const shadow = host.attachShadow({ mode: 'open' });
            const appContext = context.nearest.app;
            const state = appContext.state;
            StyleSheet.adopt(shadow, () => appContext.app.style, () => page.style);
            const variables = page.variableIds.map(id => state.variables[id]);
            const { locals: variableLocals, states: variableStates } = DrxVariable.instantiate(variables);
            const pageContext: PageRenderContext = {
                type: RenderContextType.Page,
                parent: context,
                nearest: context.nearest,
                locals: {},
                state,
                compiled: context.compiled,
                page,
                variables: variableStates
            };
            pageContext.nearest = { ...context.nearest, page: pageContext };
            const appVariables = appContext.app.variableIds.map(id => state.variables[id]);
            const types = appContext.app.typeIds.map(id => state.types[id]);
            const pageDrx = {
                app: {
                    variables: DrxVariable.createApi(appVariables, appContext.variableStates, types),
                    get instance() { return appContext.instance; }
                },
                page: { variables: DrxVariable.createApi(variables, variableStates, types) },
                apis: DrxApi.createApi(appContext.app.apiIds, state, types),
                services: ScriptCompiler.instantiateServices(appContext.app.serviceIds, state, context.compiled, appContext.serviceInstances),
                router: DrxRouter.createApi(container.ownerDocument.defaultView, appContext.routerState),
                pages: DrxPage.createApi(appContext.app.pageIds, appContext),
                modal: modalApi
            };
            const PageClass = ScriptCompiler.instantiate(context.compiled, page.id, pageDrx);
            const instance = PageClass ? new PageClass() : undefined;
            pageContext.locals = { ...context.locals, modal: modalApi, ...ScriptCompiler.bindMethods(instance), ...variableLocals };
            DrxTemplate.mount(shadow, page.template, pageContext);
            instance?.onMount?.();
            Signal.cleanup(() => {
                instance?.onUnmount?.();
                host.remove();
            });
        });
    },
    preview(container: Node, id: string, context: PreviewContext): Scope {
        return Signal.scope(() => {
            const host = document.createElement(NodeType.Page);
            host.style.display = 'contents';
            container.appendChild(host);
            const shadow = host.attachShadow({ mode: 'open' });
            StyleSheet.adopt(shadow, () => context.root.proxy.app.style(), () => context.root.proxy.pages[id].style(), ...context.styleSheets);
            DrxTemplate.preview(shadow, () => context.root.proxy.pages[id].template(), context);
            Signal.cleanup(() => host.remove());
        });
    },
    createApi(pageIds: string[], appContext: AppRenderContext): Record<string, any> {
        const state = appContext.state;
        return pageIds.reduce((api, id) => {
            const page = state.pages[id];
            return Object.assign(api, {
                [page.name]: {
                    show: () => {
                        if (!appContext.currentPage) throw new Error(`drx.pages.${page.name}.show() can't be used when <x-router> is configured -- the router owns page selection.`);
                        appContext.currentPage(page.name);
                    },
                    showModal: (options: { data?: any } = {}) => {
                        return ModalManager.open(modalContainer => DrxPage.mount(modalContainer, page, appContext), options);
                    }
                }
            });
        }, {} as Record<string, any>);
    }
};
