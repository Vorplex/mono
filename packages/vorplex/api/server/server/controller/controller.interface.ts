import { Awaitable, Injector } from '@vorplex/core';
import { Server } from '../server.model';
import { Handler } from './handler.interface';
import { IncomingMessage, ServerResponse } from 'http';

export type ControllerGuard = (params: { injector: Injector, server: Server, request: IncomingMessage, response: ServerResponse }) => Awaitable<boolean>;

export interface Controller {
    route: string;
    guards?: ControllerGuard[];
    handlers: Handler[];
}
