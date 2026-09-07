import { $Id, $Tson } from '@vorplex/core';
import { DrxDocumentState } from '../../drx';
import { DrxDom } from '../../drx-dom';
import { DrxType } from '../type';
import { NodeType } from '../node-type';
import { DrxApiEndpoint } from './endpoint';

export interface DrxApi {
    id: string;
    name: string;
    url: string;
    endpointIds: string[];
}

export interface ApiRequestOptions {
    parameters?: Record<string, string>;
    headers?: Record<string, string>;
    body?: any;
}

export interface ApiRequestResult {
    raw: Response;
    value(): Promise<any>;
}

export const DrxApi = {
    from(parent: Element, state: DrxDocumentState): DrxApi[] {
        const elements = Array.from(parent.querySelectorAll(`:scope > ${NodeType.Api}`));
        return elements.map(element => DrxApi.parse(element, state));
    },
    parse(element: Element, state: DrxDocumentState): DrxApi {
        const endpoints = DrxApiEndpoint.from(element, state);
        const api: DrxApi = {
            id: DrxDom.getAttribute(element, 'id') ?? $Id.guid(),
            name: DrxDom.getRequiredAttribute(element, 'name'),
            url: DrxDom.getRequiredAttribute(element, 'url'),
            endpointIds: endpoints.map(endpoint => endpoint.id)
        };
        state.apis[api.id] = api;
        return api;
    },
    to(api: DrxApi, state: DrxDocumentState): Element {
        const element = document.createElement(NodeType.Api);
        element.setAttribute('id', api.id);
        element.setAttribute('name', api.name);
        element.setAttribute('url', api.url);
        for (const id of api.endpointIds) element.appendChild(DrxApiEndpoint.to(state.apiEndpoints[id], state));
        return element;
    },
    // Turns declaration-only <x-api>/<x-endpoint> schema into the drx.apis.<api>.<endpoint>.request(...) surface.
    createApi(apiIds: string[], state: DrxDocumentState, types: DrxType[]): Record<string, Record<string, { request(options?: ApiRequestOptions): Promise<ApiRequestResult> }>> {
        const api: Record<string, Record<string, { request(options?: ApiRequestOptions): Promise<ApiRequestResult> }>> = {};
        for (const apiId of apiIds) {
            const definition = state.apis[apiId];
            const endpoints: Record<string, { request(options?: ApiRequestOptions): Promise<ApiRequestResult> }> = {};
            for (const endpointId of definition.endpointIds) {
                const endpoint = state.apiEndpoints[endpointId];
                endpoints[endpoint.name] = {
                    request: (options: ApiRequestOptions = {}) => DrxApi.request(definition, endpoint, state, types, options)
                };
            }
            api[definition.name] = endpoints;
        }
        return api;
    },
    async request(api: DrxApi, endpoint: DrxApiEndpoint, state: DrxDocumentState, types: DrxType[], options: ApiRequestOptions = {}): Promise<ApiRequestResult> {
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
        const url = new URL(api.url + path);
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
                    const [parsed] = $Tson.parse(DrxType.resolve(response?.type ?? 'any', types)).parse(json);
                    value = parsed;
                    resolved = true;
                }
                return value;
            }
        };
    }
};
