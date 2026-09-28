import { $Id, $Path, $Router, Signal } from '@vorplex/core';
import { DrxDocumentState } from '../../drx';
import { DrxDom } from '../../drx-dom';
import { PreviewContext } from '../../preview-context';
import { RenderContext, RouteGroup } from '../../render-context';
import { NodeType } from '../node-type';
import { DrxTemplate, DrxTemplateItem } from '../template-item';
import { DrxRouter } from './router';

export interface DrxRouterRoute {
    id: string;
    type: NodeType.RouterRoute;
    route?: string;
    exact?: boolean;
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
            route: DrxDom.getAttribute(element, 'route'),
            exact: DrxDom.getBooleanAttribute(element, 'exact'),
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
        if (item.exact) DrxDom.setAttribute(element, 'exact', 'true');
        for (const child of DrxTemplate.to(item.template, state)) element.appendChild(child);
        return element;
    },
    createGroup(): RouteGroup {
        return { routes: Signal.create<DrxRouterRoute[]>([]), ready: Signal.create(false) };
    },
    match(item: DrxRouterRoute, path: string): { params: Record<string, string>; rest: string } | null {
        if (!item.exact) return $Router.matchPrefix(item.route, path);
        const params = $Router.match(item.route, path);
        return params ? { params, rest: '' } : null;
    },
    mount(container: Node, item: DrxRouterRoute, context: RenderContext): void {
        const host = DrxDom.createHost(container, NodeType.RouterRoute);
        container.appendChild(host);
        const group = context.routeGroup;
        if (item.route != null && group) {
            group.routes(routes => [...routes, item]);
            Signal.cleanup(() => group.routes(routes => routes.filter(route => route !== item)));
        }
        Signal.effect(() => {
            const path = context.routeRest ?? context.nearest.app.router.route();
            const match = item.route == null
                ? !group?.ready() || group.routes().some(route => DrxRouterRoute.match(route, path)) ? null : { params: {}, rest: path }
                : DrxRouterRoute.match(item, path);
            if (!match) return;
            const params = context.locals.router?.params?.() ?? {};
            const pathname = path.trim().split(/[?#]/, 1)[0];
            const base = `/${$Path.join(context.locals.router?.base ?? '/', pathname.slice(0, pathname.length - match.rest.length))}`;
            const routeContext: RenderContext = {
                ...RenderContext.withLocals(context, {
                    router: DrxRouter.createLocal(context.nearest.app.router.route, { ...params, ...match.params }, container.ownerDocument.defaultView, base)
                }),
                routeRest: match.rest,
                routeGroup: DrxRouterRoute.createGroup()
            };
            DrxTemplate.mount(host, item.template, routeContext);
            routeContext.routeGroup.ready(true);
        });
        Signal.cleanup(() => host.remove());
    },
    preview(container: Node, id: string, context: PreviewContext): Node {
        const host = DrxDom.createHost(container, NodeType.RouterRoute);
        host.setAttribute('data-drx-id', id);
        container.appendChild(host);
        DrxTemplate.preview(host, () => context.root.proxy.routerRoutes[id].template(), context);
        Signal.cleanup(() => host.remove());
        return host;
    }
};
