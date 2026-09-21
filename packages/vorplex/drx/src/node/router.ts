import { $Router, Signal, SignalProxy } from '@vorplex/core';

export interface RouterApi {
    navigate(route: string): void;
    active(route: string): boolean;
    readonly route: string;
    readonly params: Record<string, string>;
}

export interface RouterLocal {
    route: Signal<string>;
    params: SignalProxy<Record<string, string>>;
    active(route: string): boolean;
}

export const DrxRouter = {
    mount(view: Window): RouterLocal {
        const getCurrentPath = () => view.location.hash.replace(/^#/, '') || '/';
        const path = Signal.create(getCurrentPath());
        const onHashChange = () => path(getCurrentPath());
        view.addEventListener('hashchange', onHashChange);
        Signal.cleanup(() => view.removeEventListener('hashchange', onHashChange));
        return DrxRouter.createLocal(path, {});
    },
    createLocal(path: Signal<string>, params: Record<string, string>): RouterLocal {
        return {
            route: path,
            params: Signal.create(params).proxy,
            active: (route: string) => $Router.matchPrefix(route, path()) !== null
        };
    },
    createApi(view: Window, pathSignal: Signal<string>): RouterApi {
        return {
            navigate: (route: string) => { view.location.hash = route; },
            active: (route: string) => $Router.matchPrefix(route, pathSignal()) !== null,
            get route() { return pathSignal(); },
            get params() { return {}; }
        };
    }
};
