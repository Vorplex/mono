import { $Router, $String, $Tson, $Url, TsonDefinition } from '@vorplex/core';
import type { DrxDocument, DrxDocumentState, DrxScope } from './document';
import { DrxExpression } from './expression';
import { DrxComponent } from './node/component/component';
import { DrxLibraries } from './node/libraries';
import { NodeType } from './node/node-type';
import { DrxType } from './node/type';

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

export class DrxValidation {

    private static readonly reserved = {
        app: ['asset', 'router', 'modal'],
        component: ['asset'],
        attribute: ['id', 'component', 'asset']
    };

    public static isValidName(name: string): boolean {
        return /^[a-z][a-zA-Z0-9]*$/.test(name ?? '');
    }

    private static findDocumentSelectors(css: string | undefined): string[] {
        if (!css?.trim() || typeof CSSStyleSheet === 'undefined') return [];
        const sheet = new CSSStyleSheet();
        try {
            sheet.replaceSync(css);
        } catch {
            return [];
        }
        const selectors: string[] = [];
        const walk = (rules: CSSRuleList): void => {
            for (const rule of Array.from(rules)) {
                if (rule instanceof CSSStyleRule && /(^|[\s,>+~(])(:root|html|body)(?![\w-])/i.test(rule.selectorText)) selectors.push(rule.selectorText);
                if ('cssRules' in rule) walk((rule as CSSGroupingRule).cssRules);
            }
        };
        walk(sheet.cssRules);
        return selectors;
    }

    private static findTemplateScope(document: DrxDocument, id: string): DrxScope | undefined {
        const parent = DrxValidation.findTemplateParent(document.state.value, id);
        if (!parent) return undefined;
        return parent.type === 'component' ? { document, type: 'component', componentId: parent.id } : { document, type: 'app' };
    }

    private static findTemplateParent(state: DrxDocumentState, id: string, visited: Set<string> = new Set()): { type: 'app' | 'page' | 'component'; id: string } | undefined {
        if (visited.has(id)) return undefined;
        visited.add(id);
        const references = (template: { id: string }[]) => template.some(item => item.id === id);
        if (references(state.app.template)) return { type: 'app', id: state.app.id };
        for (const page of Object.values(state.pages)) if (references(page.template)) return { type: 'page', id: page.id };
        for (const component of Object.values(state.components)) {
            if (references(component.template) || component.componentIds.includes(id)) return { type: 'component', id: component.id };
        }
        for (const element of Object.values(state.elements)) if (references(element.template)) return this.findTemplateParent(state, element.id, visited);
        for (const item of Object.values(state.ifs)) if (references(item.template)) return this.findTemplateParent(state, item.id, visited);
        for (const item of Object.values(state.fors)) if (references(item.template)) return this.findTemplateParent(state, item.id, visited);
        for (const item of Object.values(state.routerRoutes)) if (references(item.template)) return this.findTemplateParent(state, item.id, visited);
        return undefined;
    }

    private static readonly validators: Record<string, Record<string, (state: DrxDocumentState, document: DrxDocument) => DrxProblem[]>> = {
        general: {
            validateTemplateReferencesExist(state: DrxDocumentState): DrxProblem[] {
                const problems: DrxProblem[] = [];
                const tables: Partial<Record<NodeType, Record<string, unknown>>> = {
                    [NodeType.Text]: state.texts,
                    [NodeType.If]: state.ifs,
                    [NodeType.For]: state.fors,
                    [NodeType.Element]: state.elements,
                    [NodeType.Icon]: state.icons,
                    [NodeType.ComponentInstance]: state.componentInstances,
                    [NodeType.PageContainer]: state.pageContainers,
                    [NodeType.RouterRoute]: state.routerRoutes
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
                walk(state.app.template);
                for (const page of Object.values(state.pages)) walk(page.template);
                for (const component of Object.values(state.components)) walk(component.template);
                for (const item of Object.values(state.elseIfs)) walk(item.template);
                for (const item of Object.values(state.elses)) walk(item.template);
                return problems;
            },
            validateReferencesExist(state: DrxDocumentState): DrxProblem[] {
                const problems: DrxProblem[] = [];
                const check = (target: DrxProblemTarget, kind: string, ids: (string | undefined)[], table: Record<string, unknown>) => {
                    for (const id of ids) if (id && !table[id]) problems.push({ severity: 'error', code: 'DRX001', message: `${kind} reference "${id}" does not exist`, target });
                };
                const app: DrxProblemTarget = { type: NodeType.App, id: state.app.id };
                check(app, 'Page', state.app.pageIds, state.pages);
                check(app, 'Variable', state.app.variableIds, state.variables);
                check(app, 'Service', state.app.serviceIds, state.services);
                check(app, 'Asset', state.app.assetIds, state.assets);
                check(app, 'Component', state.app.componentIds, state.components);
                check(app, 'Type', state.app.typeIds, state.types);
                check(app, 'Api', state.app.apiIds, state.apis);
                for (const page of Object.values(state.pages)) check({ type: NodeType.Page, id: page.id }, 'Variable', page.variableIds, state.variables);
                for (const component of Object.values(state.components)) {
                    const target: DrxProblemTarget = { type: NodeType.Component, id: component.id };
                    check(target, 'Variable', component.variableIds, state.variables);
                    check(target, 'Service', component.serviceIds, state.services);
                    check(target, 'Asset', component.assetIds, state.assets);
                    check(target, 'Type', component.typeIds, state.types);
                    check(target, 'Component', component.componentIds, state.components);
                    check(target, 'Property', component.propertyIds, state.componentProperties);
                    check(target, 'Event', component.eventIds, state.componentEvents);
                    check(target, 'Api', component.apiIds, state.apis);
                }
                for (const api of Object.values(state.apis)) check({ type: NodeType.Api, id: api.id }, 'Endpoint', api.endpointIds, state.apiEndpoints);
                for (const endpoint of Object.values(state.apiEndpoints)) {
                    const target: DrxProblemTarget = { type: NodeType.ApiEndpoint, id: endpoint.id };
                    check(target, 'Parameter', endpoint.parameterIds, state.apiParameters);
                    check(target, 'Header', endpoint.headerIds, state.apiHeaders);
                    check(target, 'Body', [endpoint.bodyId], state.apiBodies);
                    check(target, 'Response', [endpoint.responseId], state.apiResponses);
                }
                for (const item of Object.values(state.ifs)) {
                    const target: DrxProblemTarget = { type: NodeType.If, id: item.id };
                    check(target, 'Else-if', item.branchIds, state.elseIfs);
                    check(target, 'Else', [item.elseId], state.elses);
                }
                return problems;
            }
        },
        page: {
            validateNoDocumentSelectors(state: DrxDocumentState): DrxProblem[] {
                const problems: DrxProblem[] = [];
                for (const page of Object.values(state.pages)) {
                    for (const selector of DrxValidation.findDocumentSelectors(page.style)) {
                        problems.push({ severity: 'warning', code: 'DRX020', message: `Page style selector "${selector}" targets the document and has no effect -- document styles (:root, html, body) belong in the app style`, target: { type: NodeType.Page, id: page.id } });
                    }
                }
                return problems;
            },
            validateNameRequired(state: DrxDocumentState): DrxProblem[] {
                return Object.values(state.pages)
                    .filter(page => !page.name?.trim())
                    .map(page => ({ severity: 'error' as const, code: 'DRX003', message: 'Page name is required', target: { type: NodeType.Page, id: page.id } }));
            }
        },
        component: {
            validateNoDocumentSelectors(state: DrxDocumentState): DrxProblem[] {
                const problems: DrxProblem[] = [];
                for (const component of Object.values(state.components)) {
                    for (const selector of DrxValidation.findDocumentSelectors(component.style)) {
                        problems.push({ severity: 'warning', code: 'DRX020', message: `Component style selector "${selector}" targets the document and has no effect -- a component only styles its own markup`, target: { type: NodeType.Component, id: component.id } });
                    }
                }
                return problems;
            },
            validateNameRequired(state: DrxDocumentState): DrxProblem[] {
                return Object.values(state.components)
                    .filter(component => !component.name?.trim())
                    .map(component => ({ severity: 'error' as const, code: 'DRX003', message: 'Component name is required', target: { type: NodeType.Component, id: component.id } }));
            },
            validateLocalNamesUnique(state: DrxDocumentState): DrxProblem[] {
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
            validateContainmentNotCircular(state: DrxDocumentState): DrxProblem[] {
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
            validateNameRequired(state: DrxDocumentState): DrxProblem[] {
                return Object.values(state.variables)
                    .filter(variable => !variable.name?.trim())
                    .map(variable => ({ severity: 'error' as const, code: 'DRX003', message: 'Variable name is required', target: { type: NodeType.Variable, id: variable.id } }));
            },
            validateTypeRequired(state: DrxDocumentState): DrxProblem[] {
                return Object.values(state.variables)
                    .filter(variable => !variable.type?.trim())
                    .map(variable => ({ severity: 'error' as const, code: 'DRX003', message: 'Variable type is required', target: { type: NodeType.Variable, id: variable.id } }));
            }
        },
        type: {
            validateNameRequired(state: DrxDocumentState): DrxProblem[] {
                return Object.values(state.types)
                    .filter(type => !type.name?.trim())
                    .map(type => ({ severity: 'error' as const, code: 'DRX003', message: 'Type name is required', target: { type: NodeType.Type, id: type.id } }));
            },
            validateDefinitionValid(state: DrxDocumentState): DrxProblem[] {
                return Object.values(state.types)
                    .filter(type => !$Tson.definitions.includes(type.type?.type as TsonDefinition['type']))
                    .map(type => ({ severity: 'error' as const, code: 'DRX018', message: `Type "${type.name}" has a malformed definition (unrecognized or missing "type" discriminator)`, target: { type: NodeType.Type, id: type.id } }));
            },
            validateReferencesResolve(state: DrxDocumentState, document: DrxDocument): DrxProblem[] {
                const problems: DrxProblem[] = [];
                const check = (scope: DrxScope, kind: string, item: { name: string; type: string } | undefined, target: DrxProblemTarget) => {
                    if (!item?.type || $Tson.definitions.includes(item.type as TsonDefinition['type']) || DrxType.find(scope, item.type)) return;
                    problems.push({ severity: 'warning', code: 'DRX005', message: `Unknown type "${item.type}" for ${kind} "${item.name}"`, target });
                };
                const appScope: DrxScope = { document, type: 'app' };
                for (const id of state.app.variableIds) check(appScope, 'variable', state.variables[id], { type: NodeType.Variable, id });
                for (const page of Object.values(state.pages)) for (const id of page.variableIds) check(appScope, 'variable', state.variables[id], { type: NodeType.Variable, id });
                for (const component of Object.values(state.components)) {
                    const scope: DrxScope = { document, type: 'component', componentId: component.id };
                    for (const id of component.variableIds) check(scope, 'variable', state.variables[id], { type: NodeType.Variable, id });
                    for (const id of component.propertyIds) check(scope, 'property', state.componentProperties[id], { type: NodeType.ComponentProperty, id });
                    for (const id of component.eventIds) check(scope, 'event', state.componentEvents[id], { type: NodeType.ComponentEvent, id });
                }
                return problems;
            }
        },
        service: {
            validateNameRequired(state: DrxDocumentState): DrxProblem[] {
                return Object.values(state.services)
                    .filter(service => !service.name?.trim())
                    .map(service => ({ severity: 'error' as const, code: 'DRX003', message: 'Service name is required', target: { type: NodeType.Service, id: service.id } }));
            },
            validateScriptRequired(state: DrxDocumentState): DrxProblem[] {
                return Object.values(state.services)
                    .filter(service => !service.script?.trim())
                    .map(service => ({ severity: 'error' as const, code: 'DRX003', message: `Service "${service.name}" has no script`, target: { type: NodeType.Service, id: service.id } }));
            }
        },
        asset: {
            validateNameRequired(state: DrxDocumentState): DrxProblem[] {
                return Object.values(state.assets)
                    .filter(asset => !asset.name?.trim())
                    .map(asset => ({ severity: 'error' as const, code: 'DRX003', message: 'Asset name is required', target: { type: NodeType.Asset, id: asset.id } }));
            },
            validateSourceRequired(state: DrxDocumentState): DrxProblem[] {
                return Object.values(state.assets)
                    .filter(asset => asset.source.type === 'external' ? !asset.source.url?.trim() : !asset.source.content?.trim())
                    .map(asset => ({ severity: 'error' as const, code: 'DRX003', message: `Asset "${asset.name}" has no source -- set "src" or add inline content`, target: { type: NodeType.Asset, id: asset.id } }));
            }
        },
        api: {
            validateNameRequired(state: DrxDocumentState): DrxProblem[] {
                return Object.values(state.apis)
                    .filter(api => !api.name?.trim())
                    .map(api => ({ severity: 'error' as const, code: 'DRX003', message: 'Api name is required', target: { type: NodeType.Api, id: api.id } }));
            },
            validateUrlRequired(state: DrxDocumentState): DrxProblem[] {
                return Object.values(state.apis)
                    .filter(api => !api.url?.trim())
                    .map(api => ({ severity: 'error' as const, code: 'DRX007', message: `Api "${api.name}" has no URL`, target: { type: NodeType.Api, id: api.id } }));
            },
            validateUrlValid(state: DrxDocumentState): DrxProblem[] {
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
            }
        },
        apiEndpoint: {
            validateNameRequired(state: DrxDocumentState): DrxProblem[] {
                return Object.values(state.apiEndpoints)
                    .filter(endpoint => !endpoint.name?.trim())
                    .map(endpoint => ({ severity: 'error' as const, code: 'DRX003', message: 'Endpoint name is required', target: { type: NodeType.ApiEndpoint, id: endpoint.id } }));
            },
            validatePathRequired(state: DrxDocumentState): DrxProblem[] {
                return Object.values(state.apiEndpoints)
                    .filter(endpoint => !endpoint.path?.trim())
                    .map(endpoint => ({ severity: 'error' as const, code: 'DRX003', message: 'Endpoint path is required', target: { type: NodeType.ApiEndpoint, id: endpoint.id } }));
            },
            validateMethodRecognized(state: DrxDocumentState): DrxProblem[] {
                return Object.values(state.apiEndpoints)
                    .filter(endpoint => endpoint.method?.trim() && !['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].includes(endpoint.method.toUpperCase()))
                    .map(endpoint => ({ severity: 'warning' as const, code: 'DRX008', message: `Endpoint "${endpoint.name}" uses unrecognized HTTP method "${endpoint.method}"`, target: { type: NodeType.ApiEndpoint, id: endpoint.id } }));
            },
            validatePathParametersDeclared(state: DrxDocumentState): DrxProblem[] {
                const problems: DrxProblem[] = [];
                for (const endpoint of Object.values(state.apiEndpoints)) {
                    const declared = new Set(endpoint.parameterIds.map(id => state.apiParameters[id]?.name).filter((name): name is string => !!name));
                    for (const match of endpoint.path?.matchAll(/\{(\w+)\}/g) ?? []) {
                        if (!declared.has(match[1])) problems.push({ severity: 'error', code: 'DRX010', message: `Endpoint path references "{${match[1]}}" but no parameter named "${match[1]}" is declared`, target: { type: NodeType.ApiEndpoint, id: endpoint.id } });
                    }
                }
                return problems;
            },
            validateParameterNamesRequired(state: DrxDocumentState): DrxProblem[] {
                const problems: DrxProblem[] = [];
                for (const endpoint of Object.values(state.apiEndpoints)) {
                    for (const id of endpoint.parameterIds) {
                        if (state.apiParameters[id] && !state.apiParameters[id].name?.trim()) problems.push({ severity: 'error', code: 'DRX003', message: `Parameter name is required on endpoint "${endpoint.name}"`, target: { type: NodeType.ApiEndpoint, id: endpoint.id } });
                    }
                }
                return problems;
            },
            validateHeaderNames(state: DrxDocumentState): DrxProblem[] {
                const problems: DrxProblem[] = [];
                for (const endpoint of Object.values(state.apiEndpoints)) {
                    const target: DrxProblemTarget = { type: NodeType.ApiEndpoint, id: endpoint.id };
                    for (const id of endpoint.headerIds) {
                        const header = state.apiHeaders[id];
                        if (!header) continue;
                        if (!header.name?.trim()) problems.push({ severity: 'error', code: 'DRX003', message: `Header name is required on endpoint "${endpoint.name}"`, target });
                        else if (!/^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/.test(header.name)) problems.push({ severity: 'error', code: 'DRX013', message: `Header name "${header.name}" is not a valid HTTP header name`, target });
                    }
                }
                return problems;
            },
            validateDefinitionsValid(state: DrxDocumentState): DrxProblem[] {
                const problems: DrxProblem[] = [];
                const valid = (definition: TsonDefinition | undefined) => $Tson.definitions.includes(definition?.type as TsonDefinition['type']);
                for (const endpoint of Object.values(state.apiEndpoints)) {
                    const target: DrxProblemTarget = { type: NodeType.ApiEndpoint, id: endpoint.id };
                    const body = endpoint.bodyId ? state.apiBodies[endpoint.bodyId] : undefined;
                    const response = endpoint.responseId ? state.apiResponses[endpoint.responseId] : undefined;
                    if (body && !valid(body.definition)) problems.push({ severity: 'error', code: 'DRX018', message: `Body of endpoint "${endpoint.name}" has a malformed definition (unrecognized or missing "type" discriminator)`, target });
                    if (response && !valid(response.definition)) problems.push({ severity: 'error', code: 'DRX018', message: `Response of endpoint "${endpoint.name}" has a malformed definition (unrecognized or missing "type" discriminator)`, target });
                }
                return problems;
            }
        },
        componentProperty: {
            validateNameRequired(state: DrxDocumentState): DrxProblem[] {
                return Object.values(state.componentProperties)
                    .filter(property => !property.name?.trim())
                    .map(property => ({ severity: 'error' as const, code: 'DRX003', message: 'Property name is required', target: { type: NodeType.ComponentProperty, id: property.id } }));
            },
            validateTypeRequired(state: DrxDocumentState): DrxProblem[] {
                return Object.values(state.componentProperties)
                    .filter(property => !property.type?.trim())
                    .map(property => ({ severity: 'error' as const, code: 'DRX003', message: 'Property type is required', target: { type: NodeType.ComponentProperty, id: property.id } }));
            }
        },
        componentEvent: {
            validateNameRequired(state: DrxDocumentState): DrxProblem[] {
                return Object.values(state.componentEvents)
                    .filter(event => !event.name?.trim())
                    .map(event => ({ severity: 'error' as const, code: 'DRX003', message: 'Event name is required', target: { type: NodeType.ComponentEvent, id: event.id } }));
            },
            validateTypeRequired(state: DrxDocumentState): DrxProblem[] {
                return Object.values(state.componentEvents)
                    .filter(event => !event.type?.trim())
                    .map(event => ({ severity: 'error' as const, code: 'DRX003', message: 'Event type is required', target: { type: NodeType.ComponentEvent, id: event.id } }));
            }
        },
        element: {
            validateTagRequired(state: DrxDocumentState): DrxProblem[] {
                return Object.values(state.elements)
                    .filter(element => !element.tag?.trim())
                    .map(element => ({ severity: 'error' as const, code: 'DRX003', message: 'Element tag is required', target: { type: NodeType.Element, id: element.id } }));
            },
            validateHtmlWithoutChildren(state: DrxDocumentState): DrxProblem[] {
                return Object.values(state.elements)
                    .filter(element => element.attributes.html !== undefined && element.template.length > 0)
                    .map(element => ({ severity: 'warning' as const, code: 'DRX021', message: 'Element has an "html" attribute and child content -- the children are not rendered', target: { type: NodeType.Element, id: element.id } }));
            }
        },
        attribute: {
            validateBindings(state: DrxDocumentState): DrxProblem[] {
                const problems: DrxProblem[] = [];
                const owners: { attributes: Record<string, string>; target: DrxProblemTarget }[] = [
                    ...Object.values(state.elements).map(element => ({ attributes: element.attributes, target: { type: NodeType.Element, id: element.id } })),
                    ...Object.values(state.icons).map(icon => ({ attributes: icon.attributes, target: { type: NodeType.Icon, id: icon.id } }))
                ];
                for (const { attributes, target } of owners) {
                    for (const [name, value] of Object.entries(attributes)) {
                        if (name === 'class.' || name === 'style.') problems.push({ severity: 'error', code: 'DRX016', message: `Attribute "${name}" is missing a ${name === 'class.' ? 'class' : 'style property'} name after the "."`, target });
                        else if ((name.startsWith('class.') || name.startsWith('style.')) && (!value?.trim() || !DrxExpression.isLiteral(value))) problems.push({ severity: 'error', code: 'DRX022', message: `Attribute "${name}" must be an expression without {{ }}, e.g. ${name}="isActive()"`, target });
                    }
                }
                return problems;
            }
        },
        if: {
            validateConditionRequired(state: DrxDocumentState): DrxProblem[] {
                return Object.values(state.ifs)
                    .filter(item => !item.condition?.trim())
                    .map(item => ({ severity: 'error' as const, code: 'DRX003', message: 'If condition is required', target: { type: NodeType.If, id: item.id } }));
            },
            validateElseIfConditionRequired(state: DrxDocumentState): DrxProblem[] {
                return Object.values(state.elseIfs)
                    .filter(item => !item.condition?.trim())
                    .map(item => ({ severity: 'error' as const, code: 'DRX003', message: 'Else-if condition is required', target: { type: NodeType.ElseIf, id: item.id } }));
            }
        },
        for: {
            validateEachRequired(state: DrxDocumentState): DrxProblem[] {
                return Object.values(state.fors)
                    .filter(item => !item.each?.trim())
                    .map(item => ({ severity: 'error' as const, code: 'DRX003', message: 'For "each" expression is required', target: { type: NodeType.For, id: item.id } }));
            },
            validateAsRequired(state: DrxDocumentState): DrxProblem[] {
                return Object.values(state.fors)
                    .filter(item => !item.as?.trim())
                    .map(item => ({ severity: 'error' as const, code: 'DRX003', message: 'For "as" alias is required', target: { type: NodeType.For, id: item.id } }));
            },
            validateAliasesValidIdentifiers(state: DrxDocumentState): DrxProblem[] {
                const problems: DrxProblem[] = [];
                for (const item of Object.values(state.fors)) {
                    if (item.as && !/^[A-Za-z_$][\w$]*$/.test(item.as)) problems.push({ severity: 'error', code: 'DRX015', message: `For "as" alias "${item.as}" is not a valid identifier`, target: { type: NodeType.For, id: item.id } });
                    if (item.index && !/^[A-Za-z_$][\w$]*$/.test(item.index)) problems.push({ severity: 'error', code: 'DRX015', message: `For "index" alias "${item.index}" is not a valid identifier`, target: { type: NodeType.For, id: item.id } });
                    if (item.key && !/^[A-Za-z_$][\w$]*$/.test(item.key)) problems.push({ severity: 'error', code: 'DRX015', message: `For "key" alias "${item.key}" is not a valid identifier`, target: { type: NodeType.For, id: item.id } });
                }
                return problems;
            },
            validateAliasesDistinct(state: DrxDocumentState): DrxProblem[] {
                const problems: DrxProblem[] = [];
                for (const item of Object.values(state.fors)) {
                    const aliases = [item.as, item.index, item.key].filter((alias): alias is string => !!alias);
                    if (new Set(aliases).size !== aliases.length) problems.push({ severity: 'error', code: 'DRX017', message: 'For "as", "index" and "key" aliases must be distinct from one another', target: { type: NodeType.For, id: item.id } });
                }
                return problems;
            }
        },
        icon: {
            validateNameRequired(state: DrxDocumentState): DrxProblem[] {
                return Object.values(state.icons)
                    .filter(icon => !icon.name?.trim())
                    .map(icon => ({ severity: 'error' as const, code: 'DRX003', message: 'Icon name is required', target: { type: NodeType.Icon, id: icon.id } }));
            }
        },
        componentInstance: {
            validateComponentRequired(state: DrxDocumentState): DrxProblem[] {
                return Object.values(state.componentInstances)
                    .filter(instance => !instance.component?.trim())
                    .map(instance => ({ severity: 'error' as const, code: 'DRX003', message: 'Component instance "component" is required', target: { type: NodeType.ComponentInstance, id: instance.id } }));
            },
            validateComponentExists(state: DrxDocumentState, document: DrxDocument): DrxProblem[] {
                const problems: DrxProblem[] = [];
                for (const instance of Object.values(state.componentInstances)) {
                    if (!instance.component || !DrxExpression.isLiteral(instance.component)) continue;
                    const scope = DrxValidation.findTemplateScope(document, instance.id);
                    if (!scope || DrxComponent.find(scope, instance.component)) continue;
                    const target: DrxProblemTarget = { type: NodeType.ComponentInstance, id: instance.id };
                    const namespace = DrxLibraries.getNamespace(instance.component);
                    if (namespace !== undefined && state.app.libraries?.[namespace] == null) problems.push({ severity: 'error', code: 'DRX025', message: `Unknown library with name "${namespace}" -- declare it in the app's <x-libraries>`, target });
                    else if (namespace === undefined || document.libraries.value[namespace]) problems.push({ severity: 'error', code: 'DRX004', message: `Unknown component with name "${instance.component}"`, target });
                }
                return problems;
            },
            validateAttributesDeclared(state: DrxDocumentState, document: DrxDocument): DrxProblem[] {
                const problems: DrxProblem[] = [];
                for (const instance of Object.values(state.componentInstances)) {
                    if (!instance.component || !DrxExpression.isLiteral(instance.component)) continue;
                    const scope = DrxValidation.findTemplateScope(document, instance.id);
                    const resolved = scope && DrxComponent.find(scope, instance.component);
                    if (!resolved) continue;
                    const source = resolved.scope.document.state.value;
                    const declared = new Set([
                        ...resolved.component.propertyIds.map(id => source.componentProperties[id]?.name),
                        ...resolved.component.eventIds.map(id => source.componentEvents[id]?.name)
                    ].filter(name => name != null).map(name => name.toLowerCase()));
                    for (const attribute of Object.keys(instance.attributes)) {
                        if (attribute === 'id' || attribute === 'component' || declared.has(attribute.toLowerCase())) continue;
                        problems.push({ severity: 'warning', code: 'DRX028', message: `Attribute "${attribute}" is not a declared property or event of "${instance.component}" and has no effect`, target: { type: NodeType.ComponentInstance, id: instance.id } });
                    }
                }
                return problems;
            }
        },
        pageContainer: {
            validatePageRequired(state: DrxDocumentState): DrxProblem[] {
                return Object.values(state.pageContainers)
                    .filter(container => !container.page?.trim())
                    .map(container => ({ severity: 'error' as const, code: 'DRX003', message: 'Page container "page" is required', target: { type: NodeType.PageContainer, id: container.id } }));
            },
            validatePageExists(state: DrxDocumentState): DrxProblem[] {
                const pageNames = new Set(Object.values(state.pages).map(page => page.name));
                return Object.values(state.pageContainers)
                    .filter(container => container.page && DrxExpression.isLiteral(container.page) && !pageNames.has(container.page))
                    .map(container => ({ severity: 'error' as const, code: 'DRX004', message: `Unknown page "${container.page}"`, target: { type: NodeType.PageContainer, id: container.id } }));
            }
        },
        router: {
            validateRoutePatternValid(state: DrxDocumentState): DrxProblem[] {
                const problems: DrxProblem[] = [];
                for (const route of Object.values(state.routerRoutes)) {
                    if (!route.route) continue;
                    try {
                        $Router.getRouteRegex(route.route);
                    } catch {
                        problems.push({ severity: 'error', code: 'DRX011', message: `Invalid route pattern "${route.route}"`, target: { type: NodeType.RouterRoute, id: route.id } });
                    }
                }
                return problems;
            },
            validateNotInsideComponent(state: DrxDocumentState): DrxProblem[] {
                const problems: DrxProblem[] = [];
                for (const route of Object.values(state.routerRoutes)) {
                    if (DrxValidation.findTemplateParent(state, route.id)?.type === 'component') {
                        problems.push({ severity: 'error', code: 'DRX019', message: 'A route can\'t be used inside a component -- components have no router to match against', target: { type: NodeType.RouterRoute, id: route.id } });
                    }
                }
                return problems;
            }
        },
        library: {
            validateLoaded(state: DrxDocumentState, document: DrxDocument): DrxProblem[] {
                const problems: DrxProblem[] = [];
                const target: DrxProblemTarget = { type: NodeType.App, id: state.app.id };
                for (const [name, url] of Object.entries(state.app.libraries ?? {})) {
                    if (!$Url.isAbsolute(url)) {
                        problems.push({ severity: 'error', code: 'DRX027', message: `Library with name "${name}" has url "${url}" that must be absolute, e.g. "https://cdn.example.com/${name}/"`, target });
                        continue;
                    }
                    if (document.libraries.value[name]) continue;
                    problems.push({ severity: 'error', code: 'DRX026', message: `Library with name "${name}" from url "${url}" is not loaded`, target });
                }
                return problems;
            },
            validateNotShadowed(state: DrxDocumentState): DrxProblem[] {
                const problems: DrxProblem[] = [];
                const names = Object.keys(state.app.libraries ?? {});
                const variableIds = [...state.app.variableIds, ...Object.values(state.pages).flatMap(page => page.variableIds)];
                for (const id of variableIds) {
                    const name = state.variables[id]?.name;
                    if (names.includes(name)) problems.push({ severity: 'warning', code: 'DRX029', message: `Variable with name "${name}" hides the app's library of the same name`, target: { type: NodeType.Variable, id } });
                }
                for (const component of Object.values(state.components)) {
                    const locals = [
                        ...component.variableIds.map(id => ({ name: state.variables[id]?.name, type: NodeType.Variable, id })),
                        ...component.propertyIds.map(id => ({ name: state.componentProperties[id]?.name, type: NodeType.ComponentProperty, id })),
                        ...component.eventIds.map(id => ({ name: state.componentEvents[id]?.name, type: NodeType.ComponentEvent, id }))
                    ];
                    for (const local of locals) {
                        if (names.includes(local.name)) problems.push({ severity: 'warning', code: 'DRX029', message: `Local with name "${local.name}" hides the app's library of the same name inside component with name "${component.name}"`, target: { type: local.type, id: local.id } });
                    }
                }
                return problems;
            }
        },
        naming: {
            validateCamelCase(state: DrxDocumentState): DrxProblem[] {
                const problems: DrxProblem[] = [];
                const check = (name: string | undefined, kind: string, target: DrxProblemTarget) => {
                    if (name && !DrxValidation.isValidName(name)) problems.push({ severity: 'error', code: 'DRX024', message: `${kind} name "${name}" must be camelCase, e.g. "${$String.camelCase(name) || 'myName'}"`, target });
                };
                for (const page of Object.values(state.pages)) check(page.name, 'Page', { type: NodeType.Page, id: page.id });
                for (const component of Object.values(state.components)) check(component.name, 'Component', { type: NodeType.Component, id: component.id });
                for (const variable of Object.values(state.variables)) check(variable.name, 'Variable', { type: NodeType.Variable, id: variable.id });
                for (const type of Object.values(state.types)) check(type.name, 'Type', { type: NodeType.Type, id: type.id });
                for (const service of Object.values(state.services)) check(service.name, 'Service', { type: NodeType.Service, id: service.id });
                for (const asset of Object.values(state.assets)) check(asset.name, 'Asset', { type: NodeType.Asset, id: asset.id });
                for (const api of Object.values(state.apis)) check(api.name, 'Api', { type: NodeType.Api, id: api.id });
                for (const endpoint of Object.values(state.apiEndpoints)) check(endpoint.name, 'Endpoint', { type: NodeType.ApiEndpoint, id: endpoint.id });
                for (const property of Object.values(state.componentProperties)) check(property.name, 'Property', { type: NodeType.ComponentProperty, id: property.id });
                for (const event of Object.values(state.componentEvents)) check(event.name, 'Event', { type: NodeType.ComponentEvent, id: event.id });
                for (const name of Object.keys(state.app.libraries ?? {})) check(name, 'Library', { type: NodeType.App, id: state.app.id });
                return problems;
            },
            validateNotReserved(state: DrxDocumentState): DrxProblem[] {
                const problems: DrxProblem[] = [];
                const { app, component, attribute } = DrxValidation.reserved;
                const variable = (id: string, reserved: string[]) => {
                    const name = state.variables[id]?.name;
                    if (reserved.includes(name)) problems.push({ severity: 'error', code: 'DRX014', message: `Variable name "${name}" is reserved and will shadow the built-in local of the same name`, target: { type: NodeType.Variable, id } });
                };
                for (const id of state.app.variableIds) variable(id, app);
                for (const page of Object.values(state.pages)) for (const id of page.variableIds) variable(id, app);
                for (const item of Object.values(state.components)) for (const id of item.variableIds) variable(id, component);
                for (const name of Object.keys(state.app.libraries ?? {})) {
                    if (app.includes(name)) problems.push({ severity: 'error', code: 'DRX014', message: `Library name "${name}" is reserved and will shadow the built-in local of the same name`, target: { type: NodeType.App, id: state.app.id } });
                }
                for (const property of Object.values(state.componentProperties)) {
                    if (attribute.includes(property.name)) problems.push({ severity: 'error', code: 'DRX014', message: `Property name "${property.name}" is reserved and can never be set by a consumer`, target: { type: NodeType.ComponentProperty, id: property.id } });
                }
                for (const event of Object.values(state.componentEvents)) {
                    if (attribute.includes(event.name)) problems.push({ severity: 'error', code: 'DRX014', message: `Event name "${event.name}" is reserved and can never be triggered by a consumer`, target: { type: NodeType.ComponentEvent, id: event.id } });
                }
                return problems;
            },
            validateNamesUnique(state: DrxDocumentState): DrxProblem[] {
                const problems: DrxProblem[] = [];
                const check = (kind: string, ids: string[], table: Record<string, { name?: string }>, target: (id: string) => DrxProblemTarget) => {
                    const seen = new Set<string>();
                    for (const id of ids) {
                        const name = table[id]?.name;
                        if (name === undefined) continue;
                        if (seen.has(name)) problems.push({ severity: 'error', code: 'DRX002', message: `Duplicate ${kind} name "${name}"`, target: target(id) });
                        else seen.add(name);
                    }
                };
                const of = (type: NodeType) => (id: string): DrxProblemTarget => ({ type, id });
                check('page', state.app.pageIds, state.pages, of(NodeType.Page));
                check('variable', state.app.variableIds, state.variables, of(NodeType.Variable));
                check('component', state.app.componentIds, state.components, of(NodeType.Component));
                check('type', state.app.typeIds, state.types, of(NodeType.Type));
                check('service', state.app.serviceIds, state.services, of(NodeType.Service));
                check('asset', state.app.assetIds, state.assets, of(NodeType.Asset));
                check('api', state.app.apiIds, state.apis, of(NodeType.Api));
                for (const page of Object.values(state.pages)) check('variable', page.variableIds, state.variables, of(NodeType.Variable));
                for (const component of Object.values(state.components)) {
                    check('component', component.componentIds, state.components, of(NodeType.Component));
                    check('type', component.typeIds, state.types, of(NodeType.Type));
                    check('service', component.serviceIds, state.services, of(NodeType.Service));
                    check('asset', component.assetIds, state.assets, of(NodeType.Asset));
                    check('api', component.apiIds, state.apis, of(NodeType.Api));
                }
                for (const api of Object.values(state.apis)) check('endpoint', api.endpointIds, state.apiEndpoints, of(NodeType.ApiEndpoint));
                for (const endpoint of Object.values(state.apiEndpoints)) {
                    const target = () => ({ type: NodeType.ApiEndpoint, id: endpoint.id });
                    check('parameter', endpoint.parameterIds, state.apiParameters, target);
                    check('header', endpoint.headerIds, state.apiHeaders, target);
                }
                return problems;
            }
        },
        expression: {
            validateSyntax(state: DrxDocumentState): DrxProblem[] {
                const problems: DrxProblem[] = [];
                const check = (body: string, source: string, where: string, target: DrxProblemTarget) => {
                    try {
                        new Function(body);
                    } catch (error) {
                        if (error instanceof SyntaxError) problems.push({ severity: 'error', code: 'DRX023', message: `Invalid ${where} "${source.trim()}": ${error.message}`, target });
                    }
                };
                const expression = (value: string | undefined, where: string, target: DrxProblemTarget) => {
                    if (value?.trim()) check(`return (${value})`, value, where, target);
                };
                const interpolation = (value: string | undefined, where: string, target: DrxProblemTarget) => {
                    for (const segment of $String.matchDelimited(value ?? '', ['{{', '}}'])) {
                        if (segment.type === 'match') expression(segment.value, where, target);
                    }
                };
                const attributes = (values: Record<string, string>, target: DrxProblemTarget) => {
                    for (const [name, value] of Object.entries(values)) {
                        if (/^on[a-z]+$/.test(name)) check(value ?? '', value ?? '', `handler ${name}`, target);
                        else if (name.startsWith('class.') || name.startsWith('style.')) { if (DrxExpression.isLiteral(value)) expression(value, `expression in ${name}`, target); }
                        else interpolation(value, `expression in ${name}`, target);
                    }
                };
                interpolation(state.app.style, 'expression in the app style', { type: NodeType.App, id: state.app.id });
                for (const page of Object.values(state.pages)) interpolation(page.style, `expression in the style of page "${page.name}"`, { type: NodeType.Page, id: page.id });
                for (const component of Object.values(state.components)) interpolation(component.style, `expression in the style of component "${component.name}"`, { type: NodeType.Component, id: component.id });
                for (const text of Object.values(state.texts)) interpolation(text.content, 'expression in text', { type: NodeType.Text, id: text.id });
                for (const element of Object.values(state.elements)) attributes(element.attributes, { type: NodeType.Element, id: element.id });
                for (const icon of Object.values(state.icons)) {
                    interpolation(icon.name, 'expression in x-icon name', { type: NodeType.Icon, id: icon.id });
                    attributes(icon.attributes, { type: NodeType.Icon, id: icon.id });
                }
                for (const item of Object.values(state.ifs)) expression(item.condition, 'x-if condition', { type: NodeType.If, id: item.id });
                for (const item of Object.values(state.elseIfs)) expression(item.condition, 'x-else-if condition', { type: NodeType.ElseIf, id: item.id });
                for (const item of Object.values(state.fors)) expression(item.each, 'x-for each', { type: NodeType.For, id: item.id });
                for (const container of Object.values(state.pageContainers)) interpolation(container.page, 'expression in x-page-container page', { type: NodeType.PageContainer, id: container.id });
                for (const instance of Object.values(state.componentInstances)) {
                    interpolation(instance.component, 'expression in x-component-instance component', { type: NodeType.ComponentInstance, id: instance.id });
                    for (const [name, value] of Object.entries(instance.attributes)) {
                        if (value?.includes('{{')) interpolation(value, `expression in ${name}`, { type: NodeType.ComponentInstance, id: instance.id });
                    }
                }
                return problems;
            }
        }
    };

    public static validate(document: DrxDocument): DrxProblem[] {
        const state = document.state.value;
        const problems: DrxProblem[] = [];
        for (const group of Object.values(this.validators)) {
            for (const validate of Object.values(group)) {
                try {
                    problems.push(...validate(state, document));
                } catch (error) {
                    problems.push({ severity: 'error', code: 'DRX000', message: `Validator crashed: ${error instanceof Error ? error.message : String(error)}`, target: { type: NodeType.App, id: state.app.id } });
                }
            }
        }
        return problems;
    }

}
