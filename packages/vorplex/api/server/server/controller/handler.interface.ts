import { Awaitable, ExtractRouteParams, Injector, Task } from '@vorplex/core';
import { HttpRequestMethod } from '../http/request-method.enum';
import { IncomingMessage, ServerResponse } from 'http';
import { HttpResponses } from '../http/response.interface';
import { Server } from '../server.model';

type QueryKeys<T extends readonly string[]> =
    { [K in T[number]as K extends `${string}?` ? never : K]: string } &
    { [K in T[number]as K extends `${infer Name}?` ? Name : never]?: string };

export interface HandlerParams<TRoute extends Record<string, string> = Record<string, string>, TQuery extends readonly string[] = readonly string[]> {
    injector: Injector;
    server: Server,
    task: Task;
    parameters: {
        route: TRoute;
        query: QueryKeys<TQuery>;
    };
    request: IncomingMessage;
    response: ServerResponse;
}

export interface Handler<TRoute extends string = string, TParameters extends string[] = string[]> {
    route: TRoute;
    parameters?: TParameters;
    method: HttpRequestMethod;
    callback: (params: HandlerParams<ExtractRouteParams<TRoute>, TParameters>) => Awaitable<HttpResponses | void>;
}

