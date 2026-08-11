import { Signal, State } from '@vorplex/core';
import { ShtmlApp } from './node/app';
import { ShtmlComponent } from './node/component/component';
import { ShtmlPage } from './node/page';
import { CompiledScripts } from './script-compiler';
import { ShtmlDocumentState } from './shtml';

export enum RenderContextType {
    App = 'app',
    Page = 'page',
    Component = 'component'
}

export interface RouterState {
    route: string;
    params: Record<string, string>;
}

export interface NearestRenderContext {
    app?: AppRenderContext;
    page?: PageRenderContext;
    component?: ComponentRenderContext;
}

export interface RenderContextBase {
    type: RenderContextType;
    parent?: RenderContext;
    nearest: NearestRenderContext;
    locals: Record<string, any>;
    state: ShtmlDocumentState;
    compiled: CompiledScripts;
}

export interface AppRenderContext extends RenderContextBase {
    type: RenderContextType.App;
    app: ShtmlApp;
    variableStates: Map<string, State<any>>;
    serviceInstances: Map<string, any>;
    currentPage?: Signal<string>;
    routerState: State<RouterState>;
    instance?: any;
}

export interface PageRenderContext extends RenderContextBase {
    type: RenderContextType.Page;
    page: ShtmlPage;
    variables: Map<string, State<any>>;
}

export interface ComponentRenderContext extends RenderContextBase {
    type: RenderContextType.Component;
    component: ShtmlComponent;
    variables: Map<string, State<any>>;
    props: Map<string, State<any>>;
    serviceInstances: Map<string, any>;
}

export type RenderContext = AppRenderContext | PageRenderContext | ComponentRenderContext;

export const RenderContext = {
    withLocals<T extends RenderContext>(parent: T, locals: Record<string, any> = {}): T {
        return {
            ...parent,
            locals: { ...parent.locals, ...locals }
        };
    }
};
