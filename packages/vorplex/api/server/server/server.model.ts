import { $Array, $Date, $Number, $Router, $String, $Tson, Awaitable, Chalk, Emitter, Injector, Logger, MimeType, ProviderScopes, Subscribable, Task, TsonError, TsonType, Unit, WebClient } from '@vorplex/core';
import * as fs from 'fs';
import { IncomingMessage, Server as NodeHttpServer, ServerResponse } from 'http';
import { Server as NodeHttpsServer } from 'https';
import { WebSocketServer } from 'ws';
import { Controller } from './controller/controller.interface';
import { Handler } from './controller/handler.interface';
import { HttpError, WebError } from './http/error.model';
import { $HttpResponder } from './http/responder.util';
import { HttpResponseCodes } from './http/response-codes.enum';
import { Action } from './hub/action.interface';
import { Hub } from './hub/hub.interface';
import { $HttpReader } from './http/reader.util';

export class Api {

    public static controller(controller: Controller) {
        return controller;
    }

    public static hub(hub: Hub) {
        return hub;
    }

    public static action<T>(action: Action<T>) {
        return action;
    }

    public static actionResult(result: { id: string, data: any }) {
        return result;
    }

    public static actionError(result: { id: string, error: { message: string, data?: any } }) {
        return result;
    }

    public static handler<TRoute extends string, TParameters extends string[]>(handler: Handler<TRoute, TParameters>) {
        return handler;
    }

}

export interface HttpServerOptions {
    port: number;
    injector?: Injector,
    hostname?: string;
    logger?: Logger;
    certificate?: {
        crt: string;
        key: string;
    }
}

export class Server {

    private _disposables: (() => void)[] = [];
    private _clients: WebClient[] = [];
    private readonly _connection: Emitter<{ client: WebClient, request: IncomingMessage }> = new Emitter();
    private readonly _disconnection: Emitter<WebClient> = new Emitter();
    private readonly _requests: Emitter<{ request: IncomingMessage, response: ServerResponse }> = new Emitter();
    private readonly _packets: Emitter<{ client: WebClient, packet: any }> = new Emitter();

    public injector: Injector;
    public options: HttpServerOptions;
    public httpServer: NodeHttpServer | NodeHttpsServer;
    public webServer: WebSocketServer;
    public controllers: Controller[] = [];
    public hubs: Hub[] = [];

    public get connection(): Subscribable<{ client: WebClient, request: IncomingMessage }> { return this._connection; }
    public get disconnection(): Subscribable<WebClient> { return this._disconnection; }
    public get clients(): ReadonlyArray<WebClient> { return this._clients; }
    public get requests(): Subscribable<{ request: IncomingMessage, response: ServerResponse }> { return this._requests; }
    public get packets(): Subscribable<{ client: WebClient, packet: any }> { return this._packets; }

    public constructor(options: HttpServerOptions) {
        this.options = options;
        this.injector = options.injector ?? new Injector();
        this.injector.addInstance(this);
    }

    public route(routes: string | string[], callback: (request: IncomingMessage, response: ServerResponse) => Awaitable<void>) {
        routes = Array.isArray(routes) ? routes : [routes];
        this.requests.subscribe(async ({ request, response }) => {
            for (const route of routes) {
                const match = $Router.match(route, request.url);
                if (match) {
                    await callback(request, response);
                }
            }
        });
    }

    public start() {
        this.options.logger?.log('Starting Server');
        this.stop();
        this.initHttpServer();
        this.initWebServer();
    }

    private initHttpServer() {
        const listener = (request: IncomingMessage, response: ServerResponse) => {
            response.setHeader('Access-Control-Allow-Origin', '*');
            response.setHeader('Access-Control-Allow-Methods', '*');
            response.setHeader('Access-Control-Allow-Headers', '*');
            if (request.method === 'OPTIONS') {
                response.end();
                return;
            }
            this._requests.emit({ request, response });
        };
        const subscription = this.requests.subscribe(async ({ request, response }) => {
            const task = new Task(`Request: ${request.method} ${request.url}`);
            try {
                task.log('Routing request');
                for (const controller of this.controllers) {
                    for (const handler of controller.handlers) {
                        if (handler.method === request.method) {
                            const match = $Router.match(`${controller.route}${handler.route}`, request.url);
                            if (match) {
                                const query = $Router.getQueryParameters(request.url);
                                task.log(`Forwarding request to controller (${controller.route}) handler (${handler.route})`);
                                for (const guard of controller.guards ?? []) {
                                    const authorized = await guard({
                                        injector: this.injector,
                                        server: this,
                                        request,
                                        response
                                    });
                                    if (!authorized) throw new HttpError(HttpResponseCodes.Unauthorized);
                                }
                                task.log(`${request.method} ${request.url}`, {
                                    attachments: {
                                        parameters: { type: 'json', value: JSON.stringify(query, null, 4) },
                                        headers: { type: 'json', value: JSON.stringify(request.headers, null, 4) }
                                    }
                                });
                                for (const parameter of handler.parameters ?? []) {
                                    if (!parameter.endsWith('?') && $String.isNullOrEmpty(query[parameter])) throw new HttpError(HttpResponseCodes.BadRequest, `Missing required query parameter (${parameter})`);
                                }
                                const result = await handler.callback({
                                    injector: this.injector,
                                    server: this,
                                    task,
                                    parameters: {
                                        route: match,
                                        query
                                    },
                                    request,
                                    response
                                });
                                if (result) {
                                    if (response.writable) {
                                        if (result.code) response.statusCode = result.code;
                                        if (result.status) response.statusMessage = result.status;
                                        if (result.headers) response.setHeaders(new Map(Object.entries(result.headers)));
                                        switch (result.type) {
                                            case 'json':
                                                response
                                                    .setHeader('Content-Type', MimeType.json)
                                                    .write(result.value === undefined ? undefined : JSON.stringify(result.value));
                                                break;
                                            case 'file':
                                                await new Promise<void>((resolve, reject) => {
                                                    response.setHeader('Content-Type', result.mimeType)
                                                    response.once('finish', () => resolve());
                                                    response.once('error', (error) => reject(error));
                                                    fs.createReadStream(result.file).pipe(response, { end: true });
                                                });
                                                break;
                                            case 'redirect':
                                                response.statusCode = 302;
                                                response.setHeader('Location', result.url);
                                                break;
                                        }
                                    }
                                }
                                if (!response.writableEnded) response.end();
                                return;
                            }
                        }
                    }
                }
                task.fail(`No route matches URL`);
                if (response.writable) {
                    response.writeHead(HttpResponseCodes.BadRequest, 'Route Not Found');
                    response.end();
                }
            } catch (error) {
                const message = error instanceof Error ? error.stack : String(error);
                task.fail(message);
                if (error instanceof HttpError) {
                    response.statusCode = error.code;
                    if (error.message) response.statusMessage = error.message;
                    response.end();
                } else $HttpResponder.internalServerError(response);
            } finally {
                task.complete();
                this.options.logger?.log(task.toConsoleLog());
            }
        });
        this.httpServer = this.options.certificate ? new NodeHttpsServer({ key: this.options.certificate.key, cert: this.options.certificate.crt, rejectUnauthorized: false }, listener) : new NodeHttpServer(listener);
        this.httpServer.listen(this.options.port, this.options.hostname);
        this.options.logger?.log(`HTTP server started listening on ${this.httpServer instanceof NodeHttpServer ? 'http' : 'https'}://${this.options.hostname ?? '0.0.0.0'}:${this.options.port}`);
        this._disposables.push(() => {
            subscription.unsubscribe();
            this.httpServer.close();
        });
    }

    private initWebServer() {
        this.webServer = new WebSocketServer({ server: this.httpServer });
        this.options.logger?.log(`WS server started listening on ${this.httpServer instanceof NodeHttpServer ? 'ws' : 'wss'}://${this.options.hostname ?? '0.0.0.0'}:${this.options.port}`);
        this.webServer.on('connection', (ws, request) => {
            const forwarded = request.headers['x-forwarded-for'] as string;
            const client = new WebClient(ws, forwarded ? forwarded.split(',')[0] : request.socket.remoteAddress.replace('::ffff:', ''));
            this._clients.push(client);
            this._connection.emit({ client, request });
            ws.on('message', packet => {
                try {
                    const json = packet.toString();
                    packet = JSON.parse(json);
                    this._packets.emit({ client, packet });
                } catch (error) { }
            });
            ws.on('close', () => {
                this._clients = $Array.remove(this._clients, client);
                this._disconnection.emit(client);
            });
        });
        const subscription = this.packets.subscribe(async ({ client, packet }) => {
            const definition = $Tson.object({
                properties: {
                    id: $Tson.string(),
                    hub: $Tson.string(),
                    action: $Tson.string(),
                    data: $Tson.any({ default: null })
                }
            });
            const schema = $Tson.parse(definition);
            let parsedPacket: TsonType<typeof definition>;
            try {
                parsedPacket = schema.parse(packet);
            } catch (error) {
                if (error instanceof TsonError) {
                    client.send({
                        error: {
                            message: error.message,
                            path: error.path,
                            schema: error.schema
                        },
                        schema
                    });
                    return;
                }
                throw error;
            }
            const task = new Task(`[${parsedPacket.id}] Packet`);
            try {
                for (const hub of this.hubs) {
                    if (hub.name === parsedPacket.hub) {
                        for (const action of hub.actions) {
                            if (action.name === parsedPacket.action) {
                                task.log(`Forwarding packet to hub (${hub.name}) with action (${action.name})`, {
                                    attachments: { packet: { type: 'json', value: JSON.stringify(packet, null, 4) } }
                                });
                                let data = parsedPacket.data;
                                if (action.schema) {
                                    try {
                                        data = $Tson.parse(action.schema).parse(parsedPacket.data);
                                    } catch (error) {
                                        if (error instanceof TsonError) {
                                            throw new WebError(`Failed to parse packet data for hub (${hub.name}) with action (${action.name})`, {
                                                message: error.message,
                                                path: error.path,
                                                schema: error.schema,
                                                value: error.value
                                            });
                                        } else throw error;
                                    }
                                }
                                await action.callback({
                                    injector: this.injector,
                                    client,
                                    task,
                                    packet: {
                                        id: parsedPacket.id,
                                        data
                                    }
                                });
                                return;
                            }
                        }
                    }
                }
                throw new WebError(`No hub (${parsedPacket.hub}) was found with action (${parsedPacket.action})`);
            } catch (error) {
                task.fail(error);
                if (error instanceof WebError) {
                    client.send(Api.actionError({
                        id: parsedPacket.id,
                        error: {
                            message: error.message,
                            data: error.data
                        }
                    }));
                }
                throw error;
            } finally {
                task.complete();
                this.options.logger?.log(task.toConsoleLog());
            };
        });
        this._disposables.push(() => {
            subscription.unsubscribe();
            this.webServer.close();
        });
    }

    public stop() {
        for (const dispose of this._disposables) {
            dispose();
        }
        this._disposables = [];
        this.httpServer = null;
        this.webServer = null;
    }

}
