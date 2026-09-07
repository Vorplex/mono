import { $Id, $Tson, TsonDefinition } from '@vorplex/core';
import { DrxApi, DrxApiBody, DrxApiEndpoint, DrxApiHeader, DrxApiParameter, DrxApiResponse, DrxType } from '@vorplex/drx';

export interface OpenAPISpec {
    openapi: string;
    info: {
        title: string;
        version: string;
        description?: string;
    };
    servers?: Array<{
        url: string;
        description?: string;
    }>;
    paths: {
        [path: string]: {
            [method: string]: {
                operationId?: string;
                summary?: string;
                description?: string;
                parameters?: Array<{
                    name: string;
                    in: 'query' | 'header' | 'path' | 'cookie';
                    description?: string;
                    required?: boolean;
                    schema?: any;
                }>;
                requestBody?: {
                    required?: boolean;
                    content?: { [contentType: string]: { schema?: any } };
                };
                responses?: {
                    [statusCode: string]: {
                        description?: string;
                        content?: { [contentType: string]: { schema?: any } };
                    };
                };
            };
        };
    };
}

function resolveRef(ref: string, spec: OpenAPISpec): any {
    const parts = ref.split('/');
    let current: any = spec;
    for (const part of parts) {
        if (part === '#') continue;
        current = current?.[part];
        if (!current) return null;
    }
    return current;
}

function convertSchemaToTson(schema: any, spec: OpenAPISpec, visited: Set<string>): TsonDefinition {
    if (!schema) return $Tson.any();

    if (schema.$ref) {
        if (visited.has(schema.$ref)) return $Tson.any();
        visited.add(schema.$ref);
        const resolved = resolveRef(schema.$ref, spec);
        return resolved ? convertSchemaToTson(resolved, spec, visited) : $Tson.any();
    }

    if (schema.allOf) {
        let properties: Record<string, TsonDefinition> = {};
        for (const sub of schema.allOf) {
            const converted = convertSchemaToTson(sub, spec, visited);
            if (converted.type === 'object' && converted.properties) properties = { ...properties, ...converted.properties };
        }
        return $Tson.object({ properties });
    }

    if (schema.oneOf || schema.anyOf) {
        const union = (schema.oneOf ?? schema.anyOf).map((sub: any) => convertSchemaToTson(sub, spec, visited));
        return $Tson.union({ union });
    }

    if (schema.enum) return $Tson.enum({ flags: schema.enum });

    switch (schema.type) {
        case 'string':
            return $Tson.string({ default: { value: schema.default ?? null } });
        case 'number':
        case 'integer':
            return $Tson.number({ default: { value: schema.default ?? 0 } });
        case 'boolean':
            return $Tson.boolean({ default: { value: schema.default ?? false } });
        case 'array':
            return $Tson.array({ itemDefinition: schema.items ? convertSchemaToTson(schema.items, spec, visited) : $Tson.any() });
        case 'object':
        case undefined:
        case null: {
            if (schema.properties) {
                const required: string[] = schema.required ?? [];
                const properties: Record<string, TsonDefinition> = {};
                for (const [key, value] of Object.entries(schema.properties)) {
                    let converted = convertSchemaToTson(value, spec, visited);
                    if (!required.includes(key) && converted.default == null) converted = { ...converted, default: { value: null } };
                    properties[key] = converted;
                }
                return $Tson.object({ properties });
            }
            if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
                return $Tson.record({ property: convertSchemaToTson(schema.additionalProperties, spec, visited) });
            }
            return $Tson.object();
        }
        default:
            return $Tson.any();
    }
}

function createUniqueTypeName(base: string, taken: Set<string>): string {
    let name = base || 'Type';
    let suffix = 1;
    while (taken.has(name)) name = `${base}${++suffix}`;
    taken.add(name);
    return name;
}

export interface ConvertedOpenAPI {
    api: DrxApi;
    endpoints: DrxApiEndpoint[];
    parameters: DrxApiParameter[];
    headers: DrxApiHeader[];
    bodies: DrxApiBody[];
    responses: DrxApiResponse[];
    types: DrxType[];
}

export function convertOpenAPIToDrx(spec: OpenAPISpec): ConvertedOpenAPI {
    const baseUrl = spec.servers?.[0]?.url ?? '';
    const takenTypeNames = new Set<string>();

    const api: DrxApi = {
        id: $Id.guid(),
        name: spec.info?.title ?? 'Api',
        url: baseUrl,
        typeIds: [],
        endpointIds: []
    };

    const endpoints: DrxApiEndpoint[] = [];
    const parameters: DrxApiParameter[] = [];
    const headers: DrxApiHeader[] = [];
    const bodies: DrxApiBody[] = [];
    const responses: DrxApiResponse[] = [];
    const types: DrxType[] = [];

    const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'] as const;

    for (const [path, pathItem] of Object.entries(spec.paths ?? {})) {
        for (const method of httpMethods) {
            const operation = (pathItem as any)?.[method];
            if (!operation) continue;

            const endpointName: string = operation.operationId || operation.summary || `${method.toUpperCase()} ${path}`;
            const sanitizedName = endpointName.replace(/[^a-zA-Z0-9]/g, '') || 'Endpoint';

            const endpointParameters: DrxApiParameter[] = (operation.parameters ?? [])
                .filter((parameter: any) => parameter.in === 'query' || parameter.in === 'path')
                .map((parameter: any): DrxApiParameter => ({
                    id: $Id.guid(),
                    name: parameter.name,
                    description: parameter.description || undefined,
                    required: parameter.required ?? false
                }));
            parameters.push(...endpointParameters);

            const endpointHeaders: DrxApiHeader[] = (operation.parameters ?? [])
                .filter((parameter: any) => parameter.in === 'header')
                .map((parameter: any): DrxApiHeader => ({
                    id: $Id.guid(),
                    name: parameter.name,
                    description: parameter.description || undefined,
                    required: parameter.required ?? false
                }));
            headers.push(...endpointHeaders);

            let bodyId: string | undefined;
            const requestSchema = operation.requestBody?.content?.['application/json']?.schema;
            if (requestSchema) {
                const type: DrxType = {
                    id: $Id.guid(),
                    name: createUniqueTypeName(`${sanitizedName}Request`, takenTypeNames),
                    type: convertSchemaToTson(requestSchema, spec, new Set())
                };
                types.push(type);
                api.typeIds.push(type.id);
                const body: DrxApiBody = { id: $Id.guid(), type: type.name };
                bodies.push(body);
                bodyId = body.id;
            }

            let responseId: string | undefined;
            const successResponse = operation.responses?.['200'] ?? operation.responses?.['201'] ?? operation.responses?.default;
            const responseSchema = successResponse?.content?.['application/json']?.schema;
            if (responseSchema) {
                const type: DrxType = {
                    id: $Id.guid(),
                    name: createUniqueTypeName(`${sanitizedName}Response`, takenTypeNames),
                    type: convertSchemaToTson(responseSchema, spec, new Set())
                };
                types.push(type);
                api.typeIds.push(type.id);
                const response: DrxApiResponse = { id: $Id.guid(), type: type.name };
                responses.push(response);
                responseId = response.id;
            }

            const endpoint: DrxApiEndpoint = {
                id: $Id.guid(),
                name: endpointName,
                path,
                method: method.toUpperCase(),
                parameterIds: endpointParameters.map(parameter => parameter.id),
                headerIds: endpointHeaders.map(header => header.id),
                bodyId,
                responseId
            };
            endpoints.push(endpoint);
            api.endpointIds.push(endpoint.id);
        }
    }

    return { api, endpoints, parameters, headers, bodies, responses, types };
}
