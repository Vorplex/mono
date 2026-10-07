import { $Path, $Router, Signal, SignalProxy } from '@vorplex/core';
import type { DrxRouterRoute } from './node/router/router-route';
import type { RouteGroup } from './render-context';

export interface DrxRouterApi {
    navigate(route: string): void;
    active(route: string, exact?: boolean): boolean;
    readonly route: string;
    readonly params: Record<string, string>;
}

export interface DrxRouterLocal {
    route: Signal<string>;
    params: SignalProxy<Record<string, string>>;
    base: string;
    active(route: string, exact?: boolean): boolean;
    navigate(route: string): void;
}

export const DrxRouter = class {

    public static mount(view: Window): DrxRouterLocal {
        const getCurrentPath = () => DrxRouter.normalize(view.location.hash.replace(/^#/, ''));
        const path = Signal.create(getCurrentPath());
        const onHashChange = () => path(getCurrentPath());
        view.addEventListener('hashchange', onHashChange);
        Signal.cleanup(() => view.removeEventListener('hashchange', onHashChange));
        return DrxRouter.createLocal(path, {}, view, '/');
    }

    public static normalize(path: string): string {
        const [pathname, ...query] = path.split('?');
        let value = pathname.startsWith('/') ? pathname : `/${pathname}`;
        if (value.length > 1 && value.endsWith('/')) value = value.slice(0, -1);
        return [value, ...query].join('?');
    }

    public static resolve(route: string, base: string): string {
        return DrxRouter.normalize(route.startsWith('.') ? `/${$Path.join(base, route)}` : route);
    }

    public static isActive(route: string, path: string, base: string, exact: boolean): boolean {
        const resolved = DrxRouter.resolve(route, base);
        return exact ? $Router.match(resolved, path) !== null : $Router.matchPrefix(resolved, path) !== null;
    }

    public static createLocal(path: Signal<string>, params: Record<string, string>, view: Window, base: string): DrxRouterLocal {
        return {
            route: path,
            params: Signal.create(params).proxy,
            base,
            active: (route: string, exact = false) => DrxRouter.isActive(route, path(), base, exact),
            navigate: (route: string) => { view.location.hash = DrxRouter.resolve(route, base); }
        };
    }

    public static createApi(view: Window, pathSignal: Signal<string>, local?: DrxRouterLocal): DrxRouterApi {
        const base = local?.base ?? '/';
        return {
            navigate: (route: string) => { view.location.hash = DrxRouter.resolve(route, base); },
            active: (route: string, exact = false) => DrxRouter.isActive(route, pathSignal(), base, exact),
            get route() { return pathSignal(); },
            get params() { return local?.params() ?? {}; }
        };
    }

    public static createGroup(): RouteGroup {
        return { routes: Signal.create<DrxRouterRoute[]>([]), ready: Signal.create(false) };
    }

    public static match(item: DrxRouterRoute, path: string): { params: Record<string, string>; rest: string } | null {
        if (!item.exact) return $Router.matchPrefix(item.route, path);
        const params = $Router.match(item.route, path);
        return params ? { params, rest: '' } : null;
    }

}
