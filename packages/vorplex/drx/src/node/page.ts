import { $Id, Scope, Signal } from '@vorplex/core';
import { DocumentStyles } from '../document-styles';
import { DrxDocumentState } from '../drx';
import { DrxDom } from '../drx-dom';
import { DrxExpressionParser } from '../expression-parser';
import { ModalManager } from '../modal-manager';
import { PreviewContext } from '../preview-context';
import { AppRenderContext, PageRenderContext, RenderContext, RenderContextType } from '../render-context';
import { DrxScripting } from '../scripting';
import { StyleSheet } from '../style-sheet';
import { DrxApi } from './api/api';
import { NodeType } from './node-type';
import { DrxRouter } from './router/router';
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
        DrxDom.setAttribute(element, 'id', page.id);
        DrxDom.setAttribute(element, 'name', page.name);
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
            DocumentStyles.mirror(shadow);
            const variables = page.variableIds.map(id => state.variables[id]);
            const { locals: variableLocals, states: variableStates } = DrxVariable.instantiate(variables);
            const appVariables = appContext.app.variableIds.map(id => state.variables[id]);
            const pageDrx = {
                app: {
                    variables: DrxVariable.createApi(appVariables, appContext.variableStates, { type: 'app' }, state),
                    get instance() { return appContext.instance; }
                },
                page: { variables: DrxVariable.createApi(variables, variableStates, { type: 'app' }, state), root: shadow },
                apis: DrxApi.createApi(state, { type: 'app' }),
                services: DrxScripting.instantiateServices(appContext.app.serviceIds, state, context.bundle, appContext.serviceInstances, { type: 'app' }),
                router: DrxRouter.createApi(container.ownerDocument.defaultView, appContext.router.route, context.locals.router),
                pages: DrxPage.createApi(appContext.app.pageIds, appContext),
                modal: context.locals.modal
            };
            const PageClass = DrxScripting.instantiate(context.bundle, page.id, pageDrx);
            const instance = PageClass ? new PageClass() : undefined;
            const pageContext: PageRenderContext = {
                type: RenderContextType.Page,
                parent: context,
                nearest: context.nearest,
                locals: {
                    ...context.locals,
                    ...DrxScripting.getFunctionLocals(instance),
                    ...variableLocals
                },
                state,
                bundle: context.bundle,
                page,
                variables: variableStates,
                routeRest: context.routeRest,
                routeGroup: context.routeGroup
            };
            pageContext.nearest = { ...context.nearest, page: pageContext };
            StyleSheet.adopt(shadow, () => DrxExpressionParser.parse(appContext.app.style ?? '', appContext.locals), () => DrxExpressionParser.parse(page.style ?? '', pageContext.locals));
            StyleSheet.registerDocumentRules(shadow.ownerDocument, page.id, () => DrxExpressionParser.parse(page.style ?? '', pageContext.locals));
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
            host.setAttribute('data-drx-id', id);
            container.appendChild(host);
            const shadow = host.attachShadow({ mode: 'open' });
            StyleSheet.attach(container.ownerDocument, () => context.root.proxy.app.style());
            DocumentStyles.mirror(shadow);
            StyleSheet.adopt(shadow, () => context.root.proxy.app.style(), () => context.root.proxy.pages[id].style(), ...context.styleSheets);
            StyleSheet.registerDocumentRules(shadow.ownerDocument, id, () => context.root.proxy.pages[id].style());
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
                    showModal: (options: { data?: any } = {}) => {
                        return ModalManager.open((modalContainer, modal) => {
                            const context: RenderContext = {
                                ...appContext,
                                locals: { ...appContext.locals, modal }
                            };
                            DrxPage.mount(modalContainer, page, context);
                        }, options);
                    }
                }
            });
        }, {} as Record<string, any>);
    }
};
