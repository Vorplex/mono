import { $Id, $Router, Signal } from '@vorplex/core';
import { DrxDocumentState } from '../drx';
import { DrxDom } from '../drx-dom';
import { PreviewContext } from '../preview-context';
import { RenderContext } from '../render-context';
import { NodeType } from './node-type';
import { DrxRouter } from './router';
import { DrxTemplate, DrxTemplateItem } from './template-item';

export interface DrxRouterRoute {
    id: string;
    type: NodeType.RouterRoute;
    route: string;
    template: DrxTemplateItem[];
}

export const DrxRouterRoute = {
    from(parent: Element, state: DrxDocumentState): DrxTemplateItem[] {
        const elements = Array.from(parent.querySelectorAll(`:scope > ${NodeType.RouterRoute}`));
        return elements.map(element => DrxRouterRoute.parse(element, state));
    },
    parse(element: Element, state: DrxDocumentState): DrxTemplateItem {
        const item: DrxRouterRoute = {
            id: DrxDom.getAttribute(element, 'id') ?? $Id.guid(),
            type: NodeType.RouterRoute,
            route: DrxDom.getRequiredAttribute(element, 'route'),
            template: DrxTemplate.from(element, state)
        };
        state.routerRoutes[item.id] = item;
        return {
            id: item.id,
            type: item.type
        };
    },
    to(item: DrxRouterRoute, state: DrxDocumentState): Element {
        const element = document.createElement(NodeType.RouterRoute);
        DrxDom.setAttribute(element, 'id', item.id);
        DrxDom.setAttribute(element, 'route', item.route);
        for (const child of DrxTemplate.to(item.template, state)) element.appendChild(child);
        return element;
    },
    mount(container: Node, item: DrxRouterRoute, context: RenderContext): void {
        const host = document.createElement(NodeType.RouterRoute);
        host.style.display = 'contents';
        container.appendChild(host);
        Signal.effect(() => {
            const match = $Router.matchPrefix(item.route, context.routeRest ?? context.nearest.app.router.route());
            if (!match) return;
            const params = context.locals.router?.params?.() ?? {};
            const routeContext: RenderContext = {
                ...RenderContext.withLocals(context, {
                    router: DrxRouter.createLocal(context.nearest.app.router.route, { ...params, ...match.params })
                }),
                routeRest: match.rest
            };
            DrxTemplate.mount(host, item.template, routeContext);
        });
        Signal.cleanup(() => host.remove());
    },
    preview(container: Node, id: string, context: PreviewContext): Node {
        const host = document.createElement(NodeType.RouterRoute);
        host.style.display = 'contents';
        host.setAttribute('data-drx-id', id);
        container.appendChild(host);
        DrxTemplate.preview(host, () => context.root.proxy.routerRoutes[id].template(), context);
        Signal.cleanup(() => host.remove());
        return host;
    }
};
