import { $Path, $Router, Signal, SignalProxy } from '@vorplex/core';

export interface RouterApi {
    navigate(route: string): void;
    active(route: string, exact?: boolean): boolean;
    readonly route: string;
    readonly params: Record<string, string>;
}

export interface RouterLocal {
    route: Signal<string>;
    params: SignalProxy<Record<string, string>>;
    base: string;
    active(route: string, exact?: boolean): boolean;
    navigate(route: string): void;
}

export const DrxRouter = {
    mount(view: Window): RouterLocal {
        const getCurrentPath = () => DrxRouter.normalize(view.location.hash.replace(/^#/, ''));
        const path = Signal.create(getCurrentPath());
        const onHashChange = () => path(getCurrentPath());
        view.addEventListener('hashchange', onHashChange);
        Signal.cleanup(() => view.removeEventListener('hashchange', onHashChange));
        return DrxRouter.createLocal(path, {}, view, '/');
    },
    normalize(path: string): string {
        const [pathname, ...query] = path.split('?');
        let value = pathname.startsWith('/') ? pathname : `/${pathname}`;
        if (value.length > 1 && value.endsWith('/')) value = value.slice(0, -1);
        return [value, ...query].join('?');
    },
    resolve(route: string, base: string): string {
        return DrxRouter.normalize(route.startsWith('.') ? `/${$Path.join(base, route)}` : route);
    },
    isActive(route: string, path: string, base: string, exact: boolean): boolean {
        const resolved = DrxRouter.resolve(route, base);
        return exact ? $Router.match(resolved, path) !== null : $Router.matchPrefix(resolved, path) !== null;
    },
    createLocal(path: Signal<string>, params: Record<string, string>, view: Window, base: string): RouterLocal {
        return {
            route: path,
            params: Signal.create(params).proxy,
            base,
            active: (route: string, exact = false) => DrxRouter.isActive(route, path(), base, exact),
            navigate: (route: string) => { view.location.hash = DrxRouter.resolve(route, base); }
        };
    },
    createApi(view: Window, pathSignal: Signal<string>, local?: RouterLocal): RouterApi {
        const base = local?.base ?? '/';
        return {
            navigate: (route: string) => { view.location.hash = DrxRouter.resolve(route, base); },
            active: (route: string, exact = false) => DrxRouter.isActive(route, pathSignal(), base, exact),
            get route() { return pathSignal(); },
            get params() { return local?.params() ?? {}; }
        };
    }
};
