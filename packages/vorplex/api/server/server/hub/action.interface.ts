import { Awaitable, Injector, Task, TsonObjectDefinition, WebClient } from '@vorplex/core';

export interface ActionParams<T = any> {
    injector: Injector;
    client: WebClient;
    task: Task,
    packet: {
        id: string;
        data: T;
    };
}

export interface Action<T = any> {
    name: string;
    schema?: TsonObjectDefinition<T>;
    callback: (params: ActionParams<T>) => Awaitable<void>;
}
