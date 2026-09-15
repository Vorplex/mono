import { $Router, $Tson, TsonDefinition } from '@vorplex/core';
import type { DrxDocumentState, DrxScope } from './drx';
import { ExpressionParser } from './expression-parser';
import { NodeType } from './node/node-type';

export interface DrxProblemTarget {
    type: NodeType;
    id: string;
}

export interface DrxProblem {
    severity: 'error' | 'warning';
    code: string;
    message: string;
    target: DrxProblemTarget;
}

export const validators = {
    general: {
        validateTemplateReferencesExist: (state: DrxDocumentState): DrxProblem[] => {
            const problems: DrxProblem[] = [];
            const tables: Partial<Record<NodeType, Record<string, unknown>>> = {
                [NodeType.Text]: state.texts,
                [NodeType.If]: state.ifs,
                [NodeType.For]: state.fors,
                [NodeType.Element]: state.elements,
                [NodeType.Icon]: state.icons,
                [NodeType.ComponentInstance]: state.componentInstances,
                [NodeType.PageContainer]: state.pageContainers
            };
            const walk = (template: { id: string; type: NodeType }[]): void => {
                for (const item of template) {
                    const node = tables[item.type]?.[item.id] as { template?: { id: string; type: NodeType }[] } | undefined;
                    if (!node) {
                        problems.push({ severity: 'error', code: 'DRX001', message: `Template reference "${item.id}" (${item.type}) does not exist`, target: { type: item.type, id: item.id } });
                        continue;
                    }
                    if (node.template) walk(node.template);
                }
            };
            for (const page of Object.values(state.pages)) walk(page.template);
            for (const component of Object.values(state.components)) walk(component.template);
            return problems;
        }
    },
    app: {
        validatePagesExists: (state: DrxDocumentState): DrxProblem[] => {
            const target: DrxProblemTarget = { type: NodeType.App, id: state.app.id };
            return state.app.pageIds
                .filter(id => !state.pages[id])
                .map(id => ({ severity: 'error' as const, code: 'DRX001', message: `Page reference "${id}" does not exist`, target }));
        },
        validateVariablesExists: (state: DrxDocumentState): DrxProblem[] => {
            const target: DrxProblemTarget = { type: NodeType.App, id: state.app.id };
            return state.app.variableIds
                .filter(id => !state.variables[id])
                .map(id => ({ severity: 'error' as const, code: 'DRX001', message: `Variable reference "${id}" does not exist`, target }));
        },
        validateServicesExists: (state: DrxDocumentState): DrxProblem[] => {
            const target: DrxProblemTarget = { type: NodeType.App, id: state.app.id };
            return state.app.serviceIds
                .filter(id => !state.services[id])
                .map(id => ({ severity: 'error' as const, code: 'DRX001', message: `Service reference "${id}" does not exist`, target }));
        },
        validateAssetsExists: (state: DrxDocumentState): DrxProblem[] => {
            const target: DrxProblemTarget = { type: NodeType.App, id: state.app.id };
            return state.app.assetIds
                .filter(id => !state.assets[id])
                .map(id => ({ severity: 'error' as const, code: 'DRX001', message: `Asset reference "${id}" does not exist`, target }));
        },
        validateComponentsExists: (state: DrxDocumentState): DrxProblem[] => {
            const target: DrxProblemTarget = { type: NodeType.App, id: state.app.id };
            return state.app.componentIds
                .filter(id => !state.components[id])
                .map(id => ({ severity: 'error' as const, code: 'DRX001', message: `Component reference "${id}" does not exist`, target }));
        },
        validateTypesExists: (state: DrxDocumentState): DrxProblem[] => {
            const target: DrxProblemTarget = { type: NodeType.App, id: state.app.id };
            return state.app.typeIds
                .filter(id => !state.types[id])
                .map(id => ({ severity: 'error' as const, code: 'DRX001', message: `Type reference "${id}" does not exist`, target }));
        },
        validateApisExists: (state: DrxDocumentState): DrxProblem[] => {
            const target: DrxProblemTarget = { type: NodeType.App, id: state.app.id };
            return state.app.apiIds
                .filter(id => !state.apis[id])
                .map(id => ({ severity: 'error' as const, code: 'DRX001', message: `Api reference "${id}" does not exist`, target }));
        },
        validateHasMountTarget: (state: DrxDocumentState): DrxProblem[] => {
            if (state.app.router || state.app.pageIds.length > 0) return [];
            return [{ severity: 'error', code: 'DRX009', message: 'App has no pages and no router configured, so nothing can be mounted', target: { type: NodeType.App, id: state.app.id } }];
        }
    },
    page: {
        validateNameRequired: (state: DrxDocumentState): DrxProblem[] => {
            return Object.values(state.pages)
                .filter(page => !page.name?.trim())
                .map(page => ({ severity: 'error' as const, code: 'DRX003', message: 'Page name is required', target: { type: NodeType.Page, id: page.id } }));
        },
        validateNamesUnique: (state: DrxDocumentState): DrxProblem[] => {
            const problems: DrxProblem[] = [];
            const seen = new Set<string>();
            for (const id of state.app.pageIds) {
                const name = state.pages[id]?.name;
                if (name === undefined) continue;
                if (seen.has(name)) problems.push({ severity: 'error', code: 'DRX002', message: `Duplicate page name "${name}"`, target: { type: NodeType.Page, id } });
                else seen.add(name);
            }
            return problems;
        },
        validateVariablesExists: (state: DrxDocumentState): DrxProblem[] => {
            const problems: DrxProblem[] = [];
            for (const page of Object.values(state.pages)) {
                const target: DrxProblemTarget = { type: NodeType.Page, id: page.id };
                for (const id of page.variableIds) if (!state.variables[id]) problems.push({ severity: 'error', code: 'DRX001', message: `Variable reference "${id}" does not exist`, target });
            }
            return problems;
        }
    },
    component: {
        validateNameRequired: (state: DrxDocumentState): DrxProblem[] => {
            return Object.values(state.components)
                .filter(component => !component.name?.trim())
                .map(component => ({ severity: 'error' as const, code: 'DRX003', message: 'Component name is required', target: { type: NodeType.Component, id: component.id } }));
        },
        validateNamesUnique: (state: DrxDocumentState): DrxProblem[] => {
            const problems: DrxProblem[] = [];
            const checkSiblings = (ids: string[]) => {
                const seen = new Set<string>();
                for (const id of ids) {
                    const name = state.components[id]?.name;
                    if (name === undefined) continue;
                    if (seen.has(name)) problems.push({ severity: 'error', code: 'DRX002', message: `Duplicate component name "${name}"`, target: { type: NodeType.Component, id } });
                    else seen.add(name);
                }
            };
            checkSiblings(state.app.componentIds);
            for (const component of Object.values(state.components)) checkSiblings(component.componentIds);
            return problems;
        },
        validateServiceNamesUnique: (state: DrxDocumentState): DrxProblem[] => {
            const problems: DrxProblem[] = [];
            for (const component of Object.values(state.components)) {
                const seen = new Set<string>();
                for (const id of component.serviceIds) {
                    const name = state.services[id]?.name;
                    if (name === undefined) continue;
                    if (seen.has(name)) problems.push({ severity: 'error', code: 'DRX002', message: `Duplicate service name "${name}"`, target: { type: NodeType.Service, id } });
                    else seen.add(name);
                }
            }
            return problems;
        },
        validateAssetNamesUnique: (state: DrxDocumentState): DrxProblem[] => {
            const problems: DrxProblem[] = [];
            for (const component of Object.values(state.components)) {
                const seen = new Set<string>();
                for (const id of component.assetIds) {
                    const name = state.assets[id]?.name;
                    if (name === undefined) continue;
                    if (seen.has(name)) problems.push({ severity: 'error', code: 'DRX002', message: `Duplicate asset name "${name}"`, target: { type: NodeType.Asset, id } });
                    else seen.add(name);
                }
            }
            return problems;
        },
        validateApiNamesUnique: (state: DrxDocumentState): DrxProblem[] => {
            const problems: DrxProblem[] = [];
            for (const component of Object.values(state.components)) {
                const seen = new Set<string>();
                for (const id of component.apiIds) {
                    const name = state.apis[id]?.name;
                    if (name === undefined) continue;
                    if (seen.has(name)) problems.push({ severity: 'error', code: 'DRX002', message: `Duplicate api name "${name}"`, target: { type: NodeType.Api, id } });
                    else seen.add(name);
                }
            }
            return problems;
        },
        validateLocalNamesUnique: (state: DrxDocumentState): DrxProblem[] => {
            const problems: DrxProblem[] = [];
            for (const component of Object.values(state.components)) {
                const locals = [
                    ...component.variableIds.map(id => ({ id, name: state.variables[id]?.name, type: NodeType.Variable })),
                    ...component.propertyIds.map(id => ({ id, name: state.componentProperties[id]?.name, type: NodeType.ComponentProperty })),
                    ...component.eventIds.map(id => ({ id, name: state.componentEvents[id]?.name, type: NodeType.ComponentEvent }))
                ];
                const seen = new Set<string>();
                for (const entry of locals) {
                    if (entry.name === undefined) continue;
                    if (seen.has(entry.name)) problems.push({ severity: 'error', code: 'DRX002', message: `Duplicate name "${entry.name}" shared between a component's variables, properties and events`, target: { type: entry.type, id: entry.id } });
                    else seen.add(entry.name);
                }
            }
            return problems;
        },
        validateVariablesExists: (state: DrxDocumentState): DrxProblem[] => {
            const problems: DrxProblem[] = [];
            for (const component of Object.values(state.components)) {
                const target: DrxProblemTarget = { type: NodeType.Component, id: component.id };
                for (const id of component.variableIds) if (!state.variables[id]) problems.push({ severity: 'error', code: 'DRX001', message: `Variable reference "${id}" does not exist`, target });
            }
            return problems;
        },
        validateServicesExists: (state: DrxDocumentState): DrxProblem[] => {
            const problems: DrxProblem[] = [];
            for (const component of Object.values(state.components)) {
                const target: DrxProblemTarget = { type: NodeType.Component, id: component.id };
                for (const id of component.serviceIds) if (!state.services[id]) problems.push({ severity: 'error', code: 'DRX001', message: `Service reference "${id}" does not exist`, target });
            }
            return problems;
        },
        validateAssetsExists: (state: DrxDocumentState): DrxProblem[] => {
            const problems: DrxProblem[] = [];
            for (const component of Object.values(state.components)) {
                const target: DrxProblemTarget = { type: NodeType.Component, id: component.id };
                for (const id of component.assetIds) if (!state.assets[id]) problems.push({ severity: 'error', code: 'DRX001', message: `Asset reference "${id}" does not exist`, target });
            }
            return problems;
        },
        validateTypesExists: (state: DrxDocumentState): DrxProblem[] => {
            const problems: DrxProblem[] = [];
            for (const component of Object.values(state.components)) {
                const target: DrxProblemTarget = { type: NodeType.Component, id: component.id };
                for (const id of component.typeIds) if (!state.types[id]) problems.push({ severity: 'error', code: 'DRX001', message: `Type reference "${id}" does not exist`, target });
            }
            return problems;
        },
        validateComponentsExists: (state: DrxDocumentState): DrxProblem[] => {
            const problems: DrxProblem[] = [];
            for (const component of Object.values(state.components)) {
                const target: DrxProblemTarget = { type: NodeType.Component, id: component.id };
                for (const id of component.componentIds) if (!state.components[id]) problems.push({ severity: 'error', code: 'DRX001', message: `Component reference "${id}" does not exist`, target });
            }
            return problems;
        },
        validatePropertiesExists: (state: DrxDocumentState): DrxProblem[] => {
            const problems: DrxProblem[] = [];
            for (const component of Object.values(state.components)) {
                const target: DrxProblemTarget = { type: NodeType.Component, id: component.id };
                for (const id of component.propertyIds) if (!state.componentProperties[id]) problems.push({ severity: 'error', code: 'DRX001', message: `Property reference "${id}" does not exist`, target });
            }
            return problems;
        },
        validateEventsExists: (state: DrxDocumentState): DrxProblem[] => {
            const problems: DrxProblem[] = [];
            for (const component of Object.values(state.components)) {
                const target: DrxProblemTarget = { type: NodeType.Component, id: component.id };
                for (const id of component.eventIds) if (!state.componentEvents[id]) problems.push({ severity: 'error', code: 'DRX001', message: `Event reference "${id}" does not exist`, target });
            }
            return problems;
        },
        validateApisExists: (state: DrxDocumentState): DrxProblem[] => {
            const problems: DrxProblem[] = [];
            for (const component of Object.values(state.components)) {
                const target: DrxProblemTarget = { type: NodeType.Component, id: component.id };
                for (const id of component.apiIds) if (!state.apis[id]) problems.push({ severity: 'error', code: 'DRX001', message: `Api reference "${id}" does not exist`, target });
            }
            return problems;
        },
        validateContainmentNotCircular: (state: DrxDocumentState): DrxProblem[] => {
            const problems: DrxProblem[] = [];
            const visiting = new Set<string>();
            const checked = new Set<string>();
            const visit = (id: string, path: string[]): void => {
                if (checked.has(id) || !state.components[id]) return;
                if (visiting.has(id)) {
                    problems.push({ severity: 'error', code: 'DRX006', message: `Circular component containment: ${[...path, id].join(' -> ')}`, target: { type: NodeType.Component, id } });
                    return;
                }
                visiting.add(id);
                for (const childId of state.components[id].componentIds) visit(childId, [...path, id]);
                visiting.delete(id);
                checked.add(id);
            };
            for (const id of state.app.componentIds) visit(id, []);
            return problems;
        }
    },
    variable: {
        validateNameRequired: (state: DrxDocumentState): DrxProblem[] => {
            return Object.values(state.variables)
                .filter(variable => !variable.name?.trim())
                .map(variable => ({ severity: 'error' as const, code: 'DRX003', message: 'Variable name is required', target: { type: NodeType.Variable, id: variable.id } }));
        },
        validateNameValidIdentifier: (state: DrxDocumentState): DrxProblem[] => {
            return Object.values(state.variables)
                .filter(variable => variable.name?.trim() && !/^[A-Za-z_$][\w$]*$/.test(variable.name))
                .map(variable => ({ severity: 'error' as const, code: 'DRX015', message: `Variable name "${variable.name}" is not a valid identifier and will break every expression in its scope`, target: { type: NodeType.Variable, id: variable.id } }));
        },
        validateNameNotReserved: (state: DrxDocumentState): DrxProblem[] => {
            const problems: DrxProblem[] = [];
            for (const id of state.app.variableIds) {
                if (['asset', 'modal'].includes(state.variables[id]?.name)) problems.push({ severity: 'error', code: 'DRX014', message: `Variable name "${state.variables[id].name}" is reserved and will shadow the built-in local of the same name`, target: { type: NodeType.Variable, id } });
            }
            for (const page of Object.values(state.pages)) {
                for (const id of page.variableIds) {
                    if (['asset', 'modal'].includes(state.variables[id]?.name)) problems.push({ severity: 'error', code: 'DRX014', message: `Variable name "${state.variables[id].name}" is reserved and will shadow the built-in local of the same name`, target: { type: NodeType.Variable, id } });
                }
            }
            for (const component of Object.values(state.components)) {
                for (const id of component.variableIds) {
                    if (state.variables[id]?.name === 'asset') problems.push({ severity: 'error', code: 'DRX014', message: `Variable name "${state.variables[id].name}" is reserved and will shadow the built-in local of the same name`, target: { type: NodeType.Variable, id } });
                }
            }
            return problems;
        },
        validateTypeRequired: (state: DrxDocumentState): DrxProblem[] => {
            return Object.values(state.variables)
                .filter(variable => !variable.type?.trim())
                .map(variable => ({ severity: 'error' as const, code: 'DRX003', message: 'Variable type is required', target: { type: NodeType.Variable, id: variable.id } }));
        },
        validateNamesUnique: (state: DrxDocumentState): DrxProblem[] => {
            const problems: DrxProblem[] = [];
            const checkSiblings = (ids: string[]) => {
                const seen = new Set<string>();
                for (const id of ids) {
                    const name = state.variables[id]?.name;
                    if (name === undefined) continue;
                    if (seen.has(name)) problems.push({ severity: 'error', code: 'DRX002', message: `Duplicate variable name "${name}"`, target: { type: NodeType.Variable, id } });
                    else seen.add(name);
                }
            };
            checkSiblings(state.app.variableIds);
            for (const page of Object.values(state.pages)) checkSiblings(page.variableIds);
            return problems;
        },
        validateTypeResolves: (state: DrxDocumentState): DrxProblem[] => {
            const problems: DrxProblem[] = [];
            const resolves = (scope: DrxScope, name: string): boolean => {
                if ($Tson.definitions.includes(name as TsonDefinition['type'])) return true;
                const owner = scope.type === 'app' ? state.app : state.components[scope.componentId];
                if (!owner) return true;
                const pool = [...owner.typeIds, ...owner.apiIds.flatMap(id => state.apis[id]?.typeIds ?? [])];
                return pool.some(id => state.types[id]?.name === name);
            };
            const check = (id: string, scope: DrxScope) => {
                const variable = state.variables[id];
                if (variable?.type && !resolves(scope, variable.type)) problems.push({ severity: 'warning', code: 'DRX005', message: `Unknown type "${variable.type}" for variable "${variable.name}"`, target: { type: NodeType.Variable, id } });
            };
            const appScope: DrxScope = { type: 'app' };
            for (const id of state.app.variableIds) check(id, appScope);
            for (const page of Object.values(state.pages)) for (const id of page.variableIds) check(id, appScope);
            for (const component of Object.values(state.components)) {
                const scope: DrxScope = { type: 'component', componentId: component.id };
                for (const id of component.variableIds) check(id, scope);
            }
            return problems;
        }
    },
    type: {
        validateNameRequired: (state: DrxDocumentState): DrxProblem[] => {
            return Object.values(state.types)
                .filter(type => !type.name?.trim())
                .map(type => ({ severity: 'error' as const, code: 'DRX003', message: 'Type name is required', target: { type: NodeType.Type, id: type.id } }));
        },
        validateDefinitionValid: (state: DrxDocumentState): DrxProblem[] => {
            return Object.values(state.types)
                .filter(type => !$Tson.definitions.includes(type.type?.type as TsonDefinition['type']))
                .map(type => ({ severity: 'error' as const, code: 'DRX018', message: `Type "${type.name}" has a malformed definition (unrecognized or missing "type" discriminator)`, target: { type: NodeType.Type, id: type.id } }));
        },
        validateNamesUnique: (state: DrxDocumentState): DrxProblem[] => {
            const problems: DrxProblem[] = [];
            const checkPool = (owner: { typeIds: string[]; apiIds: string[] }) => {
                const pool = [...owner.typeIds, ...owner.apiIds.flatMap(id => state.apis[id]?.typeIds ?? [])];
                const seen = new Set<string>();
                for (const id of pool) {
                    const name = state.types[id]?.name;
                    if (name === undefined) continue;
                    if (seen.has(name)) problems.push({ severity: 'error', code: 'DRX002', message: `Duplicate type name "${name}"`, target: { type: NodeType.Type, id } });
                    else seen.add(name);
                }
            };
            checkPool(state.app);
            for (const component of Object.values(state.components)) checkPool(component);
            return problems;
        }
    },
    service: {
        validateNameRequired: (state: DrxDocumentState): DrxProblem[] => {
            return Object.values(state.services)
                .filter(service => !service.name?.trim())
                .map(service => ({ severity: 'error' as const, code: 'DRX003', message: 'Service name is required', target: { type: NodeType.Service, id: service.id } }));
        },
        validateScriptRequired: (state: DrxDocumentState): DrxProblem[] => {
            return Object.values(state.services)
                .filter(service => !service.script?.trim())
                .map(service => ({ severity: 'error' as const, code: 'DRX003', message: `Service "${service.name}" has no script`, target: { type: NodeType.Service, id: service.id } }));
        },
        validateNamesUnique: (state: DrxDocumentState): DrxProblem[] => {
            const problems: DrxProblem[] = [];
            const seen = new Set<string>();
            for (const id of state.app.serviceIds) {
                const name = state.services[id]?.name;
                if (name === undefined) continue;
                if (seen.has(name)) problems.push({ severity: 'error', code: 'DRX002', message: `Duplicate service name "${name}"`, target: { type: NodeType.Service, id } });
                else seen.add(name);
            }
            return problems;
        }
    },
    asset: {
        validateNameRequired: (state: DrxDocumentState): DrxProblem[] => {
            return Object.values(state.assets)
                .filter(asset => !asset.name?.trim())
                .map(asset => ({ severity: 'error' as const, code: 'DRX003', message: 'Asset name is required', target: { type: NodeType.Asset, id: asset.id } }));
        },
        validateNamesUnique: (state: DrxDocumentState): DrxProblem[] => {
            const problems: DrxProblem[] = [];
            const seen = new Set<string>();
            for (const id of state.app.assetIds) {
                const name = state.assets[id]?.name;
                if (name === undefined) continue;
                if (seen.has(name)) problems.push({ severity: 'error', code: 'DRX002', message: `Duplicate asset name "${name}"`, target: { type: NodeType.Asset, id } });
                else seen.add(name);
            }
            return problems;
        }
    },
    api: {
        validateNameRequired: (state: DrxDocumentState): DrxProblem[] => {
            return Object.values(state.apis)
                .filter(api => !api.name?.trim())
                .map(api => ({ severity: 'error' as const, code: 'DRX003', message: 'Api name is required', target: { type: NodeType.Api, id: api.id } }));
        },
        validateUrlRequired: (state: DrxDocumentState): DrxProblem[] => {
            return Object.values(state.apis)
                .filter(api => !api.url?.trim())
                .map(api => ({ severity: 'warning' as const, code: 'DRX007', message: `Api "${api.name}" has no URL`, target: { type: NodeType.Api, id: api.id } }));
        },
        validateUrlValid: (state: DrxDocumentState): DrxProblem[] => {
            const problems: DrxProblem[] = [];
            for (const api of Object.values(state.apis)) {
                if (!api.url?.trim()) continue;
                try {
                    new URL(api.url);
                } catch {
                    problems.push({ severity: 'error', code: 'DRX012', message: `Api "${api.name}" has an invalid URL "${api.url}"`, target: { type: NodeType.Api, id: api.id } });
                }
            }
            return problems;
        },
        validateNamesUnique: (state: DrxDocumentState): DrxProblem[] => {
            const problems: DrxProblem[] = [];
            const seen = new Set<string>();
            for (const id of state.app.apiIds) {
                const name = state.apis[id]?.name;
                if (name === undefined) continue;
                if (seen.has(name)) problems.push({ severity: 'error', code: 'DRX002', message: `Duplicate api name "${name}"`, target: { type: NodeType.Api, id } });
                else seen.add(name);
            }
            return problems;
        },
        validateTypesExists: (state: DrxDocumentState): DrxProblem[] => {
            const problems: DrxProblem[] = [];
            for (const api of Object.values(state.apis)) {
                const target: DrxProblemTarget = { type: NodeType.Api, id: api.id };
                for (const id of api.typeIds) if (!state.types[id]) problems.push({ severity: 'error', code: 'DRX001', message: `Type reference "${id}" does not exist`, target });
            }
            return problems;
        },
        validateEndpointsExists: (state: DrxDocumentState): DrxProblem[] => {
            const problems: DrxProblem[] = [];
            for (const api of Object.values(state.apis)) {
                const target: DrxProblemTarget = { type: NodeType.Api, id: api.id };
                for (const id of api.endpointIds) if (!state.apiEndpoints[id]) problems.push({ severity: 'error', code: 'DRX001', message: `Endpoint reference "${id}" does not exist`, target });
            }
            return problems;
        }
    },
    apiEndpoint: {
        validateNameRequired: (state: DrxDocumentState): DrxProblem[] => {
            return Object.values(state.apiEndpoints)
                .filter(endpoint => !endpoint.name?.trim())
                .map(endpoint => ({ severity: 'error' as const, code: 'DRX003', message: 'Endpoint name is required', target: { type: NodeType.ApiEndpoint, id: endpoint.id } }));
        },
        validatePathRequired: (state: DrxDocumentState): DrxProblem[] => {
            return Object.values(state.apiEndpoints)
                .filter(endpoint => !endpoint.path?.trim())
                .map(endpoint => ({ severity: 'error' as const, code: 'DRX003', message: 'Endpoint path is required', target: { type: NodeType.ApiEndpoint, id: endpoint.id } }));
        },
        validateMethodRequired: (state: DrxDocumentState): DrxProblem[] => {
            return Object.values(state.apiEndpoints)
                .filter(endpoint => !endpoint.method?.trim())
                .map(endpoint => ({ severity: 'error' as const, code: 'DRX003', message: 'Endpoint method is required', target: { type: NodeType.ApiEndpoint, id: endpoint.id } }));
        },
        validateMethodRecognized: (state: DrxDocumentState): DrxProblem[] => {
            return Object.values(state.apiEndpoints)
                .filter(endpoint => endpoint.method?.trim() && !['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].includes(endpoint.method.toUpperCase()))
                .map(endpoint => ({ severity: 'warning' as const, code: 'DRX008', message: `Endpoint "${endpoint.name}" uses unrecognized HTTP method "${endpoint.method}"`, target: { type: NodeType.ApiEndpoint, id: endpoint.id } }));
        },
        validateParametersExists: (state: DrxDocumentState): DrxProblem[] => {
            const problems: DrxProblem[] = [];
            for (const endpoint of Object.values(state.apiEndpoints)) {
                const target: DrxProblemTarget = { type: NodeType.ApiEndpoint, id: endpoint.id };
                for (const id of endpoint.parameterIds) if (!state.apiParameters[id]) problems.push({ severity: 'error', code: 'DRX001', message: `Parameter reference "${id}" does not exist`, target });
            }
            return problems;
        },
        validateHeadersExists: (state: DrxDocumentState): DrxProblem[] => {
            const problems: DrxProblem[] = [];
            for (const endpoint of Object.values(state.apiEndpoints)) {
                const target: DrxProblemTarget = { type: NodeType.ApiEndpoint, id: endpoint.id };
                for (const id of endpoint.headerIds) if (!state.apiHeaders[id]) problems.push({ severity: 'error', code: 'DRX001', message: `Header reference "${id}" does not exist`, target });
            }
            return problems;
        },
        validateBodyExists: (state: DrxDocumentState): DrxProblem[] => {
            return Object.values(state.apiEndpoints)
                .filter(endpoint => endpoint.bodyId && !state.apiBodies[endpoint.bodyId])
                .map(endpoint => ({ severity: 'error' as const, code: 'DRX001', message: `Body reference "${endpoint.bodyId}" does not exist`, target: { type: NodeType.ApiEndpoint, id: endpoint.id } }));
        },
        validateResponseExists: (state: DrxDocumentState): DrxProblem[] => {
            return Object.values(state.apiEndpoints)
                .filter(endpoint => endpoint.responseId && !state.apiResponses[endpoint.responseId])
                .map(endpoint => ({ severity: 'error' as const, code: 'DRX001', message: `Response reference "${endpoint.responseId}" does not exist`, target: { type: NodeType.ApiEndpoint, id: endpoint.id } }));
        },
        validatePathParametersDeclared: (state: DrxDocumentState): DrxProblem[] => {
            const problems: DrxProblem[] = [];
            for (const endpoint of Object.values(state.apiEndpoints)) {
                const declared = new Set(endpoint.parameterIds.map(id => state.apiParameters[id]?.name).filter((name): name is string => !!name));
                for (const match of endpoint.path?.matchAll(/\{(\w+)\}/g) ?? []) {
                    if (!declared.has(match[1])) problems.push({ severity: 'error', code: 'DRX010', message: `Endpoint path references "{${match[1]}}" but no parameter named "${match[1]}" is declared`, target: { type: NodeType.ApiEndpoint, id: endpoint.id } });
                }
            }
            return problems;
        }
    },
    apiParameter: {
        validateNameRequired: (state: DrxDocumentState): DrxProblem[] => {
            return Object.values(state.apiParameters)
                .filter(parameter => !parameter.name?.trim())
                .map(parameter => ({ severity: 'error' as const, code: 'DRX003', message: 'Parameter name is required', target: { type: NodeType.ApiEndpoint, id: parameter.id } }));
        },
        validateNamesUnique: (state: DrxDocumentState): DrxProblem[] => {
            const problems: DrxProblem[] = [];
            for (const endpoint of Object.values(state.apiEndpoints)) {
                const seen = new Set<string>();
                for (const id of endpoint.parameterIds) {
                    const name = state.apiParameters[id]?.name;
                    if (name === undefined) continue;
                    if (seen.has(name)) problems.push({ severity: 'error', code: 'DRX002', message: `Duplicate parameter name "${name}"`, target: { type: NodeType.ApiEndpoint, id } });
                    else seen.add(name);
                }
            }
            return problems;
        }
    },
    apiHeader: {
        validateNameRequired: (state: DrxDocumentState): DrxProblem[] => {
            return Object.values(state.apiHeaders)
                .filter(header => !header.name?.trim())
                .map(header => ({ severity: 'error' as const, code: 'DRX003', message: 'Header name is required', target: { type: NodeType.ApiEndpoint, id: header.id } }));
        },
        validateNameValid: (state: DrxDocumentState): DrxProblem[] => {
            return Object.values(state.apiHeaders)
                .filter(header => header.name?.trim() && !/^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/.test(header.name))
                .map(header => ({ severity: 'error' as const, code: 'DRX013', message: `Header name "${header.name}" is not a valid HTTP header name`, target: { type: NodeType.ApiEndpoint, id: header.id } }));
        },
        validateNamesUnique: (state: DrxDocumentState): DrxProblem[] => {
            const problems: DrxProblem[] = [];
            for (const endpoint of Object.values(state.apiEndpoints)) {
                const seen = new Set<string>();
                for (const id of endpoint.headerIds) {
                    const name = state.apiHeaders[id]?.name;
                    if (name === undefined) continue;
                    if (seen.has(name)) problems.push({ severity: 'error', code: 'DRX002', message: `Duplicate header name "${name}"`, target: { type: NodeType.ApiEndpoint, id } });
                    else seen.add(name);
                }
            }
            return problems;
        }
    },
    apiBody: {
        validateTypeRequired: (state: DrxDocumentState): DrxProblem[] => {
            return Object.values(state.apiBodies)
                .filter(body => !body.type?.trim())
                .map(body => ({ severity: 'error' as const, code: 'DRX003', message: 'Body type is required', target: { type: NodeType.ApiEndpoint, id: body.id } }));
        },
        validateTypeResolves: (state: DrxDocumentState): DrxProblem[] => {
            const problems: DrxProblem[] = [];
            const resolves = (scope: DrxScope, name: string): boolean => {
                if ($Tson.definitions.includes(name as TsonDefinition['type'])) return true;
                const owner = scope.type === 'app' ? state.app : state.components[scope.componentId];
                if (!owner) return true;
                const pool = [...owner.typeIds, ...owner.apiIds.flatMap(id => state.apis[id]?.typeIds ?? [])];
                return pool.some(id => state.types[id]?.name === name);
            };
            const apiScope = new Map<string, DrxScope>();
            for (const id of state.app.apiIds) apiScope.set(id, { type: 'app' });
            for (const component of Object.values(state.components)) for (const id of component.apiIds) apiScope.set(id, { type: 'component', componentId: component.id });
            for (const api of Object.values(state.apis)) {
                const scope = apiScope.get(api.id) ?? { type: 'app' };
                for (const endpointId of api.endpointIds) {
                    const endpoint = state.apiEndpoints[endpointId];
                    if (!endpoint?.bodyId) continue;
                    const body = state.apiBodies[endpoint.bodyId];
                    if (body?.type && !resolves(scope, body.type)) problems.push({ severity: 'warning', code: 'DRX005', message: `Unknown type "${body.type}" for endpoint "${endpoint.name}" body`, target: { type: NodeType.ApiEndpoint, id: endpoint.bodyId } });
                }
            }
            return problems;
        }
    },
    apiResponse: {
        validateTypeRequired: (state: DrxDocumentState): DrxProblem[] => {
            return Object.values(state.apiResponses)
                .filter(response => !response.type?.trim())
                .map(response => ({ severity: 'error' as const, code: 'DRX003', message: 'Response type is required', target: { type: NodeType.ApiEndpoint, id: response.id } }));
        },
        validateTypeResolves: (state: DrxDocumentState): DrxProblem[] => {
            const problems: DrxProblem[] = [];
            const resolves = (scope: DrxScope, name: string): boolean => {
                if ($Tson.definitions.includes(name as TsonDefinition['type'])) return true;
                const owner = scope.type === 'app' ? state.app : state.components[scope.componentId];
                if (!owner) return true;
                const pool = [...owner.typeIds, ...owner.apiIds.flatMap(id => state.apis[id]?.typeIds ?? [])];
                return pool.some(id => state.types[id]?.name === name);
            };
            const apiScope = new Map<string, DrxScope>();
            for (const id of state.app.apiIds) apiScope.set(id, { type: 'app' });
            for (const component of Object.values(state.components)) for (const id of component.apiIds) apiScope.set(id, { type: 'component', componentId: component.id });
            for (const api of Object.values(state.apis)) {
                const scope = apiScope.get(api.id) ?? { type: 'app' };
                for (const endpointId of api.endpointIds) {
                    const endpoint = state.apiEndpoints[endpointId];
                    if (!endpoint?.responseId) continue;
                    const response = state.apiResponses[endpoint.responseId];
                    if (response?.type && !resolves(scope, response.type)) problems.push({ severity: 'warning', code: 'DRX005', message: `Unknown type "${response.type}" for endpoint "${endpoint.name}" response`, target: { type: NodeType.ApiEndpoint, id: endpoint.responseId } });
                }
            }
            return problems;
        }
    },
    componentProperty: {
        validateNameRequired: (state: DrxDocumentState): DrxProblem[] => {
            return Object.values(state.componentProperties)
                .filter(property => !property.name?.trim())
                .map(property => ({ severity: 'error' as const, code: 'DRX003', message: 'Property name is required', target: { type: NodeType.ComponentProperty, id: property.id } }));
        },
        validateNameNotReserved: (state: DrxDocumentState): DrxProblem[] => {
            return Object.values(state.componentProperties)
                .filter(property => ['id', 'component', 'asset'].includes(property.name))
                .map(property => ({ severity: 'error' as const, code: 'DRX014', message: `Property name "${property.name}" is reserved and can never be set by a consumer`, target: { type: NodeType.ComponentProperty, id: property.id } }));
        },
        validateTypeRequired: (state: DrxDocumentState): DrxProblem[] => {
            return Object.values(state.componentProperties)
                .filter(property => !property.type?.trim())
                .map(property => ({ severity: 'error' as const, code: 'DRX003', message: 'Property type is required', target: { type: NodeType.ComponentProperty, id: property.id } }));
        },
        validateTypeResolves: (state: DrxDocumentState): DrxProblem[] => {
            const problems: DrxProblem[] = [];
            const resolves = (scope: DrxScope, name: string): boolean => {
                if ($Tson.definitions.includes(name as TsonDefinition['type'])) return true;
                const owner = scope.type === 'app' ? state.app : state.components[scope.componentId];
                if (!owner) return true;
                const pool = [...owner.typeIds, ...owner.apiIds.flatMap(id => state.apis[id]?.typeIds ?? [])];
                return pool.some(id => state.types[id]?.name === name);
            };
            for (const component of Object.values(state.components)) {
                const scope: DrxScope = { type: 'component', componentId: component.id };
                for (const id of component.propertyIds) {
                    const property = state.componentProperties[id];
                    if (property?.type && !resolves(scope, property.type)) problems.push({ severity: 'warning', code: 'DRX005', message: `Unknown type "${property.type}" for property "${property.name}"`, target: { type: NodeType.ComponentProperty, id } });
                }
            }
            return problems;
        }
    },
    componentEvent: {
        validateNameRequired: (state: DrxDocumentState): DrxProblem[] => {
            return Object.values(state.componentEvents)
                .filter(event => !event.name?.trim())
                .map(event => ({ severity: 'error' as const, code: 'DRX003', message: 'Event name is required', target: { type: NodeType.ComponentEvent, id: event.id } }));
        },
        validateNameNotReserved: (state: DrxDocumentState): DrxProblem[] => {
            return Object.values(state.componentEvents)
                .filter(event => ['id', 'component', 'asset'].includes(event.name))
                .map(event => ({ severity: 'error' as const, code: 'DRX014', message: `Event name "${event.name}" is reserved and can never be triggered by a consumer`, target: { type: NodeType.ComponentEvent, id: event.id } }));
        },
        validateNameValidIdentifier: (state: DrxDocumentState): DrxProblem[] => {
            return Object.values(state.componentEvents)
                .filter(event => event.name?.trim() && !/^[A-Za-z_$][\w$]*$/.test(event.name))
                .map(event => ({ severity: 'error' as const, code: 'DRX015', message: `Event name "${event.name}" is not a valid identifier and will break every expression in its component's scope`, target: { type: NodeType.ComponentEvent, id: event.id } }));
        },
        validateTypeRequired: (state: DrxDocumentState): DrxProblem[] => {
            return Object.values(state.componentEvents)
                .filter(event => !event.type?.trim())
                .map(event => ({ severity: 'error' as const, code: 'DRX003', message: 'Event type is required', target: { type: NodeType.ComponentEvent, id: event.id } }));
        },
        validateTypeResolves: (state: DrxDocumentState): DrxProblem[] => {
            const problems: DrxProblem[] = [];
            const resolves = (scope: DrxScope, name: string): boolean => {
                if ($Tson.definitions.includes(name as TsonDefinition['type'])) return true;
                const owner = scope.type === 'app' ? state.app : state.components[scope.componentId];
                if (!owner) return true;
                const pool = [...owner.typeIds, ...owner.apiIds.flatMap(id => state.apis[id]?.typeIds ?? [])];
                return pool.some(id => state.types[id]?.name === name);
            };
            for (const component of Object.values(state.components)) {
                const scope: DrxScope = { type: 'component', componentId: component.id };
                for (const id of component.eventIds) {
                    const event = state.componentEvents[id];
                    if (event?.type && !resolves(scope, event.type)) problems.push({ severity: 'warning', code: 'DRX005', message: `Unknown type "${event.type}" for event "${event.name}"`, target: { type: NodeType.ComponentEvent, id } });
                }
            }
            return problems;
        }
    },
    element: {
        validateTagRequired: (state: DrxDocumentState): DrxProblem[] => {
            return Object.values(state.elements)
                .filter(element => !element.tag?.trim())
                .map(element => ({ severity: 'error' as const, code: 'DRX003', message: 'Element tag is required', target: { type: NodeType.Element, id: element.id } }));
        },
        validateAttributeNamesValid: (state: DrxDocumentState): DrxProblem[] => {
            const problems: DrxProblem[] = [];
            for (const element of Object.values(state.elements)) {
                for (const name of Object.keys(element.attributes)) {
                    if ((name === 'class.' || name === 'style.')) problems.push({ severity: 'error', code: 'DRX016', message: `Attribute "${name}" is missing a ${name === 'class.' ? 'class' : 'style property'} name after the "."`, target: { type: NodeType.Element, id: element.id } });
                }
            }
            return problems;
        }
    },
    if: {
        validateConditionRequired: (state: DrxDocumentState): DrxProblem[] => {
            return Object.values(state.ifs)
                .filter(item => !item.condition?.trim())
                .map(item => ({ severity: 'error' as const, code: 'DRX003', message: 'If condition is required', target: { type: NodeType.If, id: item.id } }));
        }
    },
    for: {
        validateEachRequired: (state: DrxDocumentState): DrxProblem[] => {
            return Object.values(state.fors)
                .filter(item => !item.each?.trim())
                .map(item => ({ severity: 'error' as const, code: 'DRX003', message: 'For "each" expression is required', target: { type: NodeType.For, id: item.id } }));
        },
        validateAsRequired: (state: DrxDocumentState): DrxProblem[] => {
            return Object.values(state.fors)
                .filter(item => !item.as?.trim())
                .map(item => ({ severity: 'error' as const, code: 'DRX003', message: 'For "as" alias is required', target: { type: NodeType.For, id: item.id } }));
        },
        validateAliasesValidIdentifiers: (state: DrxDocumentState): DrxProblem[] => {
            const problems: DrxProblem[] = [];
            for (const item of Object.values(state.fors)) {
                if (item.as && !/^[A-Za-z_$][\w$]*$/.test(item.as)) problems.push({ severity: 'error', code: 'DRX015', message: `For "as" alias "${item.as}" is not a valid identifier`, target: { type: NodeType.For, id: item.id } });
                if (item.index && !/^[A-Za-z_$][\w$]*$/.test(item.index)) problems.push({ severity: 'error', code: 'DRX015', message: `For "index" alias "${item.index}" is not a valid identifier`, target: { type: NodeType.For, id: item.id } });
                if (item.key && !/^[A-Za-z_$][\w$]*$/.test(item.key)) problems.push({ severity: 'error', code: 'DRX015', message: `For "key" alias "${item.key}" is not a valid identifier`, target: { type: NodeType.For, id: item.id } });
            }
            return problems;
        },
        validateAliasesDistinct: (state: DrxDocumentState): DrxProblem[] => {
            const problems: DrxProblem[] = [];
            for (const item of Object.values(state.fors)) {
                const aliases = [item.as, item.index, item.key].filter((alias): alias is string => !!alias);
                if (new Set(aliases).size !== aliases.length) problems.push({ severity: 'error', code: 'DRX017', message: 'For "as", "index" and "key" aliases must be distinct from one another', target: { type: NodeType.For, id: item.id } });
            }
            return problems;
        }
    },
    icon: {
        validateNameRequired: (state: DrxDocumentState): DrxProblem[] => {
            return Object.values(state.icons)
                .filter(icon => !icon.name?.trim())
                .map(icon => ({ severity: 'error' as const, code: 'DRX003', message: 'Icon name is required', target: { type: NodeType.Icon, id: icon.id } }));
        },
        validateAttributeNamesValid: (state: DrxDocumentState): DrxProblem[] => {
            const problems: DrxProblem[] = [];
            for (const icon of Object.values(state.icons)) {
                for (const name of Object.keys(icon.attributes)) {
                    if (name === 'class.' || name === 'style.') problems.push({ severity: 'error', code: 'DRX016', message: `Attribute "${name}" is missing a ${name === 'class.' ? 'class' : 'style property'} name after the "."`, target: { type: NodeType.Icon, id: icon.id } });
                }
            }
            return problems;
        }
    },
    componentInstance: {
        validateComponentRequired: (state: DrxDocumentState): DrxProblem[] => {
            return Object.values(state.componentInstances)
                .filter(instance => !instance.component?.trim())
                .map(instance => ({ severity: 'error' as const, code: 'DRX003', message: 'Component instance "component" is required', target: { type: NodeType.ComponentInstance, id: instance.id } }));
        },
        validateComponentExists: (state: DrxDocumentState): DrxProblem[] => {
            const problems: DrxProblem[] = [];
            const findParent = (id: string, visited: Set<string> = new Set()): { type: 'page' | 'component'; id: string } | undefined => {
                if (visited.has(id)) return undefined;
                visited.add(id);
                const references = (template: { id: string }[]) => template.some(item => item.id === id);
                for (const page of Object.values(state.pages)) if (references(page.template)) return { type: 'page', id: page.id };
                for (const component of Object.values(state.components)) {
                    if (references(component.template) || component.componentIds.includes(id)) return { type: 'component', id: component.id };
                }
                for (const element of Object.values(state.elements)) if (references(element.template)) return findParent(element.id, visited);
                for (const item of Object.values(state.ifs)) if (references(item.template)) return findParent(item.id, visited);
                for (const item of Object.values(state.fors)) if (references(item.template)) return findParent(item.id, visited);
                return undefined;
            };
            for (const instance of Object.values(state.componentInstances)) {
                if (!instance.component || !ExpressionParser.isLiteral(instance.component)) continue;
                const parent = findParent(instance.id);
                if (!parent) continue;
                const visibleIds = parent.type === 'page' ? state.app.componentIds : state.components[parent.id]?.componentIds ?? [];
                const visibleNames = new Set(visibleIds.map(id => state.components[id]?.name));
                if (!visibleNames.has(instance.component)) problems.push({ severity: 'error', code: 'DRX004', message: `Unknown component "${instance.component}"`, target: { type: NodeType.ComponentInstance, id: instance.id } });
            }
            return problems;
        },
        validateAttributeNamesValidIdentifiers: (state: DrxDocumentState): DrxProblem[] => {
            const problems: DrxProblem[] = [];
            const findParent = (id: string, visited: Set<string> = new Set()): { type: 'page' | 'component'; id: string } | undefined => {
                if (visited.has(id)) return undefined;
                visited.add(id);
                const references = (template: { id: string }[]) => template.some(item => item.id === id);
                for (const page of Object.values(state.pages)) if (references(page.template)) return { type: 'page', id: page.id };
                for (const component of Object.values(state.components)) {
                    if (references(component.template) || component.componentIds.includes(id)) return { type: 'component', id: component.id };
                }
                for (const element of Object.values(state.elements)) if (references(element.template)) return findParent(element.id, visited);
                for (const item of Object.values(state.ifs)) if (references(item.template)) return findParent(item.id, visited);
                for (const item of Object.values(state.fors)) if (references(item.template)) return findParent(item.id, visited);
                return undefined;
            };
            for (const instance of Object.values(state.componentInstances)) {
                if (!instance.component || !ExpressionParser.isLiteral(instance.component)) continue;
                const parent = findParent(instance.id);
                if (!parent) continue;
                const visibleIds = parent.type === 'page' ? state.app.componentIds : state.components[parent.id]?.componentIds ?? [];
                const definition = visibleIds.map(id => state.components[id]).find(component => component?.name === instance.component);
                if (!definition) continue;
                const eventNames = new Set(definition.eventIds.map(id => state.componentEvents[id]?.name));
                for (const attribute of Object.keys(instance.attributes)) {
                    if (attribute === 'id' || attribute === 'component' || eventNames.has(attribute)) continue;
                    if (!/^[A-Za-z_$][\w$]*$/.test(attribute)) problems.push({ severity: 'error', code: 'DRX015', message: `Attribute "${attribute}" is not a valid identifier and will break the "${instance.component}" instance it binds a prop on`, target: { type: NodeType.ComponentInstance, id: instance.id } });
                }
            }
            return problems;
        }
    },
    pageContainer: {
        validatePageRequired: (state: DrxDocumentState): DrxProblem[] => {
            return Object.values(state.pageContainers)
                .filter(container => !container.page?.trim())
                .map(container => ({ severity: 'error' as const, code: 'DRX003', message: 'Page container "page" is required', target: { type: NodeType.PageContainer, id: container.id } }));
        },
        validatePageExists: (state: DrxDocumentState): DrxProblem[] => {
            const pageNames = new Set(Object.values(state.pages).map(page => page.name));
            return Object.values(state.pageContainers)
                .filter(container => container.page && ExpressionParser.isLiteral(container.page) && !pageNames.has(container.page))
                .map(container => ({ severity: 'error' as const, code: 'DRX004', message: `Unknown page "${container.page}"`, target: { type: NodeType.PageContainer, id: container.id } }));
        }
    },
    router: {
        validateRoutePatternRequired: (state: DrxDocumentState): DrxProblem[] => {
            if (!state.app.router) return [];
            if (!Object.keys(state.app.router.routes).some(route => !route.trim())) return [];
            return [{ severity: 'error', code: 'DRX003', message: 'Router route pattern is required', target: { type: NodeType.Router, id: state.app.id } }];
        },
        validateRoutePatternValid: (state: DrxDocumentState): DrxProblem[] => {
            if (!state.app.router) return [];
            const problems: DrxProblem[] = [];
            for (const route of Object.keys(state.app.router.routes)) {
                if (!route) continue;
                try {
                    $Router.getRouteRegex(route);
                } catch {
                    problems.push({ severity: 'error', code: 'DRX011', message: `Invalid router route pattern "${route}"`, target: { type: NodeType.Router, id: state.app.id } });
                }
            }
            return problems;
        },
        validateRoutePageRequired: (state: DrxDocumentState): DrxProblem[] => {
            if (!state.app.router) return [];
            if (!Object.values(state.app.router.routes).some(page => !page?.trim())) return [];
            return [{ severity: 'error', code: 'DRX003', message: 'Router route "page" is required', target: { type: NodeType.Router, id: state.app.id } }];
        },
        validateRoutePagesExists: (state: DrxDocumentState): DrxProblem[] => {
            if (!state.app.router) return [];
            const pageNames = new Set(Object.values(state.pages).map(page => page.name));
            return Object.values(state.app.router.routes)
                .filter(pageName => pageName && !pageNames.has(pageName))
                .map(pageName => ({ severity: 'error' as const, code: 'DRX004', message: `Unknown page "${pageName}" in router`, target: { type: NodeType.Router, id: state.app.id } }));
        }
    }

};

