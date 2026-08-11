import { $Router, Signal, State } from '@vorplex/core';
import { RenderContext, RouterState } from '../render-context';
import { ShtmlDom } from '../shtml-dom';
import { NodeType } from './node-type';
import { ShtmlPage } from './page';

export interface ShtmlRouter {
    routes: Record<string, string>;
}

export interface RouterApi {
    navigate(route: string): void;
    readonly route: string;
    readonly params: Record<string, string>;
}

export const ShtmlRouter = {
    from(parent: Element): ShtmlRouter | undefined {
        const element = parent.querySelector(`:scope > ${NodeType.Router}`);
        return element ? ShtmlRouter.parse(element) : undefined;
    },
    parse(element: Element): ShtmlRouter {
        const routes: Record<string, string> = {};
        for (const node of ShtmlDom.getNodes(element, NodeType.RouterRoute)) {
            const route = ShtmlDom.getRequiredAttribute(node, 'route');
            const page = ShtmlDom.getRequiredAttribute(node, 'page');
            routes[route] = page;
        }
        return {
            routes
        };
    },
    to(router: ShtmlRouter): Element {
        const element = document.createElement(NodeType.Router);
        for (const [route, page] of Object.entries(router.routes)) {
            const routeElement = document.createElement(NodeType.RouterRoute);
            routeElement.setAttribute('route', route);
            routeElement.setAttribute('page', page);
            element.appendChild(routeElement);
        }
        return element;
    },
    // The shtml.router surface (navigate/route/params) for scripts -- route/params are getters, not
    // snapshotted values, so they always reflect the current routerState no matter when this object was built.
    createApi(view: Window, routerState: State<RouterState>): RouterApi {
        return {
            navigate: (route: string) => { view.location.hash = route; },
            get route() { return routerState.value.route; },
            get params() { return routerState.value.params; }
        };
    },
    mount(container: Node, router: ShtmlRouter, context: RenderContext): void {
        const view = container.ownerDocument.defaultView;
        const getCurrentPath = () => view.location.hash.replace(/^#/, '') || '/';
        const path = Signal.create(getCurrentPath());
        const onHashChange = () => path(getCurrentPath());
        view.addEventListener('hashchange', onHashChange);
        const host = document.createElement(NodeType.Router);
        host.style.display = 'contents';
        container.appendChild(host);
        // ShtmlRouter.mount is only ever called from ShtmlApp.mount, passing appContext itself as context -- so
        // context.nearest.app is always defined here.
        const appContext = context.nearest.app!;
        // Merges `router` into every page's locals so templates can bind e.g.
        // class.active="{{router.route() === '/posts'}}" -- the same State also backs shtml.router.route/.params
        // for scripts, just accessed as plain getters there.
        const routedContext = RenderContext.withLocals(context, { router: appContext.routerState.signal.proxy });
        Signal.effect(() => {
            const currentPath = path();
            const match = Object.entries(router.routes).find(([route]) => $Router.match(route, currentPath) != null);
            if (!match) return;
            const [route, pageName] = match;
            const params = $Router.match(route, currentPath) ?? {};
            appContext.routerState.set({ route, params });
            const page = appContext.app.pageIds.map(id => appContext.state.pages[id]).find(page => page.name === pageName);
            if (!page) throw new Error(`Unknown page "${pageName}"`);
            ShtmlPage.mount(host, page, routedContext);
        });
        Signal.cleanup(() => {
            view.removeEventListener('hashchange', onHashChange);
            host.remove();
        });
    }
};
