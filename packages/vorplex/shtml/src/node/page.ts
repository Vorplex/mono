import { $Id, Scope, Signal } from '@vorplex/core';
import { modalApi, ModalManager } from '../modal-manager';
import { PreviewContext } from '../preview-context';
import { AppRenderContext, PageRenderContext, RenderContext, RenderContextType } from '../render-context';
import { ScriptCompiler } from '../script-compiler';
import { ShtmlDocumentState } from '../shtml';
import { ShtmlDom } from '../shtml-dom';
import { StyleSheet } from '../style-sheet';
import { ShtmlApi } from './api/api';
import { NodeType } from './node-type';
import { ShtmlRouter } from './router';
import { ShtmlTemplate, ShtmlTemplateItem } from './template-item';
import { ShtmlVariable } from './variable';

export interface ShtmlPage {
    id: string;
    name: string;
    script?: string;
    style?: string;
    variableIds: string[];
    template: ShtmlTemplateItem[];
}

export const ShtmlPage = {
    from(parent: Element, state: ShtmlDocumentState): ShtmlPage[] {
        const elements = Array.from(parent.querySelectorAll(`:scope > ${NodeType.Page}`));
        return elements.map(element => ShtmlPage.parse(element, state));
    },
    parse(element: Element, state: ShtmlDocumentState): ShtmlPage {
        const variables = ShtmlVariable.from(element, state);
        const page: ShtmlPage = {
            id: ShtmlDom.getAttribute(element, 'id') ?? $Id.guid(),
            name: ShtmlDom.getRequiredAttribute(element, 'name'),
            script: ShtmlDom.getScript(element),
            style: ShtmlDom.getStyle(element),
            variableIds: variables.map(variable => variable.id),
            template: ShtmlTemplate.from(element, state)
        };
        state.pages[page.id] = page;
        return page;
    },
    to(page: ShtmlPage, state: ShtmlDocumentState): Element {
        const element = document.createElement(NodeType.Page);
        element.setAttribute('id', page.id);
        element.setAttribute('name', page.name);
        ShtmlDom.createScript(element, page.script);
        ShtmlDom.createStyle(element, page.style);
        for (const id of page.variableIds) element.appendChild(ShtmlVariable.to(state.variables[id]));
        for (const child of ShtmlTemplate.to(page.template, state)) element.appendChild(child);
        return element;
    },
    mount(container: Node, page: ShtmlPage, context: RenderContext): Scope {
        return Signal.scope(() => {
            const host = document.createElement(NodeType.Page);
            host.style.display = 'contents';
            container.appendChild(host);
            const shadow = host.attachShadow({ mode: 'open' });
            // ShtmlPage.mount is only ever reached through ShtmlApp.mount, ShtmlRouter.mount or
            // ShtmlPageContainer.mount, all of which guarantee an app context exists somewhere up the chain.
            const appContext = context.nearest.app!;
            const state = appContext.state;
            StyleSheet.adopt(shadow, () => appContext.app.style, () => page.style);
            const variables = page.variableIds.map(id => state.variables[id]);
            const { locals: variableLocals, states: variableStates } = ShtmlVariable.instantiate(variables);
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
            const definitions = appContext.app.definitionIds.map(id => state.definitions[id]);
            const pageShtml = {
                app: {
                    variables: ShtmlVariable.createApi(appVariables, appContext.variableStates, definitions),
                    get instance() { return appContext.instance; }
                },
                page: { variables: ShtmlVariable.createApi(variables, variableStates, definitions) },
                apis: ShtmlApi.createApi(appContext.app.apiIds, state, definitions),
                services: ScriptCompiler.instantiateServices(appContext.app.serviceIds, state, context.compiled, appContext.serviceInstances),
                router: ShtmlRouter.createApi(container.ownerDocument.defaultView, appContext.routerState),
                pages: ShtmlPage.createApi(appContext.app.pageIds, appContext),
                modal: modalApi
            };
            const PageClass = ScriptCompiler.instantiate(context.compiled, page.id, pageShtml);
            const instance = PageClass ? new PageClass() : undefined;
            pageContext.locals = { ...context.locals, modal: modalApi, ...ScriptCompiler.bindMethods(instance), ...variableLocals };

            ShtmlTemplate.mount(shadow, page.template, pageContext);
            instance?.onMount?.();
            Signal.cleanup(() => {
                instance?.onUnmount?.();
                host.remove();
            });
        });
    },
    // No evaluation: no script instantiation, no variables, no `page`/`app` shtml.* surface -- only the
    // template and the (literal CSS, non-evaluated) app + page stylesheets. Pages aren't an isolation
    // boundary, so `context` (including any `component` scope it carries) passes through unchanged, same as
    // the real runtime's own PageContainer -> Page handoff.
    preview(container: Node, id: string, context: PreviewContext): Scope {
        return Signal.scope(() => {
            const host = document.createElement(NodeType.Page);
            host.style.display = 'contents';
            container.appendChild(host);
            const shadow = host.attachShadow({ mode: 'open' });
            // context.styleSheets last -- adoptedStyleSheets resolves equal-specificity conflicts by array
            // order, last wins, so the designer's own overlays (hover outline, selection highlight) stay
            // visible over whatever the app/page's own style declares for the same selector.
            StyleSheet.adopt(shadow, () => context.root.proxy.app.style(), () => context.root.proxy.pages[id].style(), ...context.styleSheets);
            ShtmlTemplate.preview(shadow, () => context.root.proxy.pages[id].template(), context);
            Signal.cleanup(() => host.remove());
        });
    },
    // Page scripts/templates reach every declared page through shtml.pages.<name> -- .show() only works when
    // the app has no router (it owns page selection instead); .showModal() always works, mounting the page
    // inside a fresh full-screen host that the page itself styles.
    createApi(pageIds: string[], appContext: AppRenderContext): Record<string, any> {
        const state = appContext.state;
        return pageIds.reduce((api, id) => {
            const page = state.pages[id];
            return Object.assign(api, {
                [page.name]: {
                    show: () => {
                        if (!appContext.currentPage) throw new Error(`shtml.pages.${page.name}.show() can't be used when <x-router> is configured -- the router owns page selection.`);
                        appContext.currentPage(page.name);
                    },
                    showModal: (options: { data?: any } = {}) => {
                        return ModalManager.open(modalContainer => ShtmlPage.mount(modalContainer, page, appContext), options);
                    }
                }
            });
        }, {} as Record<string, any>);
    }
};
