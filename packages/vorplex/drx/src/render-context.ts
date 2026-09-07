import { Signal, State } from '@vorplex/core';
import { DrxApp } from './node/app';
import { DrxComponent } from './node/component/component';
import { DrxPage } from './node/page';
import { CompiledScripts } from './script-compiler';
import { DrxDocumentState } from './drx';

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
    state: DrxDocumentState;
    compiled: CompiledScripts;
}

export interface AppRenderContext extends RenderContextBase {
    type: RenderContextType.App;
    app: DrxApp;
    variableStates: Map<string, State<any>>;
    serviceInstances: Map<string, any>;
    currentPage?: Signal<string>;
    routerState: State<RouterState>;
    instance?: any;
}

export interface PageRenderContext extends RenderContextBase {
    type: RenderContextType.Page;
    page: DrxPage;
    variables: Map<string, State<any>>;
}

export interface ComponentRenderContext extends RenderContextBase {
    type: RenderContextType.Component;
    component: DrxComponent;
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
