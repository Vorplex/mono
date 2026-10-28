import { Context, Getter, Signal, State } from '@vorplex/core';
import type { DrxScope } from './document';
import type { DrxApp } from './node/app/app';
import type { DrxComponent } from './node/component/component';
import type { DrxComponentInstance } from './node/component/instance';
import { NodeType } from './node/node-type';
import type { DrxPage } from './node/page';
import type { DrxRouterLocal } from './router';
import type { DrxRouterRoute } from './node/router/router-route';

export interface RouteGroup {
    routes: Signal<DrxRouterRoute[]>;
    ready: Signal<boolean>;
}

export interface DrxRouteScope {
    rest?: Getter<string | undefined>;
    group: RouteGroup;
}

export interface DrxHostBase {
    scope: DrxScope;
    root: ShadowRoot;
    locals: Record<string, any>;
    variables: Map<string, State<any>>;
    instance?: any;
}

export interface DrxApplicationHost extends DrxHostBase {
    type: NodeType.App;
    app: DrxApp;
    router?: DrxRouterLocal;
    style?: CSSStyleSheet;
}

export interface DrxPageHost extends DrxHostBase {
    type: NodeType.Page;
    page: DrxPage;
}

export interface DrxComponentHost extends DrxHostBase {
    type: NodeType.Component;
    component: DrxComponent;
    componentInstance?: DrxComponentInstance;
    parent?: DrxComponentHost;
    parentLocals: Record<string, any>;
    properties: Map<string, State<any>>;
    services: Map<string, any>;
    serviceApis?: Record<string, any>;
    apis?: Record<string, any>;
    variableApis?: Record<string, any>;
    props?: Record<string, () => any>;
    events?: Record<string, { emit(value?: unknown): void }>;
}

export type DrxHost = DrxApplicationHost | DrxPageHost | DrxComponentHost;

export const DrxRenderContext = class {

    public static readonly host = Context.create<DrxHost>();

    public static readonly application = Context.create<DrxApplicationHost>();

    public static readonly component = Context.create<DrxComponentHost>();

    public static readonly locals = Context.create<Record<string, any>>({});

    public static readonly route = Context.create<DrxRouteScope>();

};
