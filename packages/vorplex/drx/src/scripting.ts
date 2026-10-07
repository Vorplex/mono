import { $String, $Tson, ModuleLoader, Scope, Signal, State, type TsonResult } from '@vorplex/core';
import type { DrxDocumentState, DrxScope } from './document';
import { DrxVariable } from './node/variable';
import { DrxType } from './node/type';

export interface DrxVariableApi<T = any> {
    get(): T;
    set(update: T | ((value: T) => T)): void;
    reset(): void;
    validate(): TsonResult<T>;
    subscribe(callback: (value: T) => void): () => void;
}

export interface DrxApiRequestOptions {
    parameters?: Record<string, string>;
    headers?: Record<string, string>;
    body?: any;
}

export interface DrxApiRequestResult {
    raw: Response;
    value(): Promise<any>;
}

export class DrxScripting {

    private static createScriptDefault(define: string): string {
        return $String.dedent(`
        export default DRX.${define}(drx => class {
            onMount() {
    
            }
            onUnmount() {
    
            }
        });
    `);
    }

    public static readonly defaults = {
        app: this.createScriptDefault('defineApp'),
        page: this.createScriptDefault('definePage'),
        component: this.createScriptDefault('defineComponent'),
        service: 'export default DRX.defineService(drx => class {\n\n});\n'
    } as const;

    public static load(bundle: string, realm: typeof globalThis = globalThis): Record<string, any> | undefined {
        if (!bundle) return undefined;
        const module = ModuleLoader.evaluate(bundle, {
            DRX: {
                defineApp: (factory: any) => factory,
                definePage: (factory: any) => factory,
                defineComponent: (factory: any) => factory,
                defineService: (factory: any) => factory
            }
        }, realm);
        return module?.default;
    }

    public static instantiate(module: Record<string, any> | undefined, id: string, drx: any): any {
        if (!id) return undefined;
        return module?.[id]?.(drx);
    }

    public static getFunctionLocals(instance: any): Record<string, any> {
        if (!instance) return {};
        const prototype = Object.getPrototypeOf(instance);
        return Object
            .getOwnPropertyNames(prototype)
            .filter(name => name !== 'constructor' && typeof instance[name] === 'function')
            .reduce((methods, name) => Object.assign(methods, { [name]: instance[name].bind(instance) }), {});
    }

    public static instantiateServices(serviceIds: string[], state: DrxDocumentState, module: Record<string, any> | undefined, instances = new Map<string, any>(), scope: DrxScope): Record<string, any> {
        const api: Record<string, any> = {};
        for (const serviceId of serviceIds) {
            const service = state.services[serviceId];
            Object.defineProperty(api, service.name, { get: () => instances.get(serviceId), enumerable: true });
        }
        const apis = DrxScripting.createApiClients(state, scope);
        for (const serviceId of serviceIds) {
            if (instances.has(serviceId)) continue;
            const service = state.services[serviceId];
            const ServiceClass = DrxScripting.instantiate(module, service.id, { apis, services: api });
            instances.set(serviceId, ServiceClass ? new ServiceClass() : undefined);
        }
        return api;
    }

    public static instantiateVariables(variables: DrxVariable[]): { locals: Record<string, any>; states: Map<string, State<any>> } {
        const states = new Map(variables.map(variable => [variable.id, new State(variable.value)] as const));
        const locals = variables.reduce((locals, variable) => Object.assign(locals, { [variable.name]: states.get(variable.id).signal.proxy }), {} as Record<string, any>);
        return { locals, states };
    }

    public static createVariableApis(variables: DrxVariable[], states: Map<string, State<any>>, scope: DrxScope, documentState: DrxDocumentState): Record<string, DrxVariableApi> {
        const subscriptions = new Set<Scope>();
        if (Scope.current) Signal.cleanup(() => {
            for (const subscription of subscriptions) subscription.dispose();
            subscriptions.clear();
        });
        return variables.reduce((api, variable) => {
            const state = states.get(variable.id)!;
            return Object.assign(api, {
                [variable.name]: {
                    get: () => state.value,
                    set: (update: any) => state.set(update),
                    reset: () => state.set(variable.value),
                    validate: () => $Tson.parse(DrxType.resolve(scope, variable.type, documentState)).parse(state.value),
                    subscribe: (callback: (value: any) => void) => {
                        const subscription = Signal.root(() => Signal.effect(() => {
                            const value = state.signal();
                            Signal.untrack(() => callback(value));
                        }));
                        subscriptions.add(subscription);
                        return () => {
                            subscription.dispose();
                            subscriptions.delete(subscription);
                        };
                    }
                } satisfies DrxVariableApi
            });
        }, {} as Record<string, DrxVariableApi>);
    }

    public static createApiClients(state: DrxDocumentState, scope: DrxScope): Record<string, Record<string, { request(options?: DrxApiRequestOptions): Promise<DrxApiRequestResult> }>> {
        const apiIds = scope.type === 'app' ? state.app.apiIds : state.components[scope.componentId].apiIds;
        const api: Record<string, Record<string, { request(options?: DrxApiRequestOptions): Promise<DrxApiRequestResult> }>> = {};
        for (const apiId of apiIds) {
            const definition = state.apis[apiId];
            const endpoints: Record<string, { request(options?: DrxApiRequestOptions): Promise<DrxApiRequestResult> }> = {};
            for (const endpointId of definition.endpointIds) {
                const endpoint = state.apiEndpoints[endpointId];
                endpoints[endpoint.name] = {
                    request: async (options: DrxApiRequestOptions = {}): Promise<DrxApiRequestResult> => {
                        const parameters = options.parameters ?? {};
                        const headers: Record<string, string> = { ...options.headers };
                        for (const id of endpoint.parameterIds) {
                            const parameter = state.apiParameters[id];
                            if (parameter.required && !(parameter.name in parameters)) throw new Error(`Missing required parameter "${parameter.name}" for endpoint "${endpoint.name}"`);
                        }
                        for (const id of endpoint.headerIds) {
                            const header = state.apiHeaders[id];
                            if (header.required && !(header.name in headers)) throw new Error(`Missing required header "${header.name}" for endpoint "${endpoint.name}"`);
                        }
                        const usedParameters = new Set<string>();
                        const path = endpoint.path.replace(/\{(\w+)\}/g, (match, name) => {
                            if (!(name in parameters)) throw new Error(`Missing path parameter "${name}" for endpoint "${endpoint.name}"`);
                            usedParameters.add(name);
                            return encodeURIComponent(parameters[name]);
                        });
                        const url = new URL(definition.url + path);
                        const body = endpoint.bodyId ? state.apiBodies[endpoint.bodyId] : undefined;
                        if (!body) {
                            for (const [name, value] of Object.entries(parameters)) {
                                if (!usedParameters.has(name)) url.searchParams.set(name, value);
                            }
                        }
                        if (body && options.body !== undefined) headers['Content-Type'] ??= 'application/json';
                        const raw = await fetch(url.toString(), {
                            method: endpoint.method,
                            headers,
                            body: body && options.body !== undefined ? JSON.stringify(options.body) : undefined
                        });
                        let value: any;
                        let resolved = false;
                        return {
                            raw,
                            async value() {
                                if (!resolved) {
                                    const response = endpoint.responseId ? state.apiResponses[endpoint.responseId] : undefined;
                                    const json = await raw.json();
                                    const definition = response ? $Tson.resolveRefs(response.definition, name => DrxType.resolve(scope, name, state)) : $Tson.any();
                                    const [parsed, errors] = $Tson.parse(definition).parse(json);
                                    if (errors.length > 0) {
                                        throw new Error(`Endpoint response did not satisfy its declared type for endpoint "${endpoint.name}"`);
                                    }
                                    value = parsed;
                                    resolved = true;
                                }
                                return value;
                            }
                        };
                    }
                };
            }
            api[definition.name] = endpoints;
        }
        return api;
    }

}
