import { $Array, $Id, $Tson, EntityAdaptor, EntityMap, State, TsonDefinition } from '@vorplex/core';
import { DrxExpression } from './expression';
import { DrxApi } from './node/api/api';
import type { DrxApiBody } from './node/api/body';
import { DrxApiEndpoint } from './node/api/endpoint';
import type { DrxApiHeader } from './node/api/header';
import type { DrxApiParameter } from './node/api/parameter';
import type { DrxApiResponse } from './node/api/response';
import { DrxApp } from './node/app/app';
import type { DrxAsset } from './node/asset';
import { DrxComponent } from './node/component/component';
import type { DrxComponentEvent } from './node/component/event';
import type { DrxComponentInstance } from './node/component/instance';
import type { DrxComponentProperty } from './node/component/property';
import { DrxElement } from './node/element';
import { DrxFor } from './node/for';
import type { DrxIcon } from './node/icon';
import { DrxElse } from './node/if/else';
import { DrxElseIf } from './node/if/else-if';
import { DrxIf } from './node/if/if';
import { NodeType } from './node/node-type';
import { DrxPage } from './node/page';
import type { DrxPageContainer } from './node/page-container';
import { DrxRouterRoute } from './node/router/router-route';
import type { DrxService } from './node/service';
import { DrxTemplateItem, DrxTemplateNode, DrxTemplateTargetType } from './node/template-item';
import type { DrxText } from './node/text';
import { DrxType } from './node/type';
import type { DrxVariable } from './node/variable';
import { DrxValidation, type DrxProblem } from './validation';

export type DrxScope =
    | { type: 'app' }
    | { type: 'component'; componentId: string };

export interface DrxDocumentState {
    app: DrxApp;
    pages: EntityMap<DrxPage>;
    variables: EntityMap<DrxVariable>;
    services: EntityMap<DrxService>;
    assets: EntityMap<DrxAsset>;
    components: EntityMap<DrxComponent>;
    types: EntityMap<DrxType>;
    elements: EntityMap<DrxElement>;
    texts: EntityMap<DrxText>;
    ifs: EntityMap<DrxIf>;
    elseIfs: EntityMap<DrxElseIf>;
    elses: EntityMap<DrxElse>;
    fors: EntityMap<DrxFor>;
    componentProperties: EntityMap<DrxComponentProperty>;
    componentEvents: EntityMap<DrxComponentEvent>;
    componentInstances: EntityMap<DrxComponentInstance>;
    pageContainers: EntityMap<DrxPageContainer>;
    routerRoutes: EntityMap<DrxRouterRoute>;
    icons: EntityMap<DrxIcon>;
    apis: EntityMap<DrxApi>;
    apiEndpoints: EntityMap<DrxApiEndpoint>;
    apiParameters: EntityMap<DrxApiParameter>;
    apiHeaders: EntityMap<DrxApiHeader>;
    apiBodies: EntityMap<DrxApiBody>;
    apiResponses: EntityMap<DrxApiResponse>;
}

export const DrxDocumentState = class {

    public static new(): DrxDocumentState {
        return {
            app: {
                id: $Id.guid(),
                name: 'App',
                pageIds: [],
                variableIds: [],
                serviceIds: [],
                assetIds: [],
                componentIds: [],
                typeIds: [],
                apiIds: [],
                template: []
            },
            pages: {},
            variables: {},
            services: {},
            assets: {},
            components: {},
            types: {},
            elements: {},
            texts: {},
            ifs: {},
            elseIfs: {},
            elses: {},
            fors: {},
            componentProperties: {},
            componentEvents: {},
            componentInstances: {},
            pageContainers: {},
            routerRoutes: {},
            icons: {},
            apis: {},
            apiEndpoints: {},
            apiParameters: {},
            apiHeaders: {},
            apiBodies: {},
            apiResponses: {}
        };
    }

}

export class DrxDocument {

    public readonly state: State<DrxDocumentState>;

    constructor(state: DrxDocumentState) {
        this.state = new State<DrxDocumentState>(state);
    }

    public validate(): DrxProblem[] {
        return DrxValidation.validate(this.state.value);
    }

    public toString(): string {
        const state = this.state.value;
        return DrxApp.to(state.app, state).outerHTML;
    }

    public addNode(targetType: DrxTemplateTargetType, targetId: string, node: DrxTemplateNode): void {
        this.state.set(state => {
            switch (node.type) {
                case NodeType.Element: state = { ...state, elements: EntityAdaptor.create(state.elements, node) }; break;
                case NodeType.If: state = { ...state, ifs: EntityAdaptor.create(state.ifs, node) }; break;
                case NodeType.For: state = { ...state, fors: EntityAdaptor.create(state.fors, node) }; break;
                case NodeType.ComponentInstance: state = { ...state, componentInstances: EntityAdaptor.create(state.componentInstances, node) }; break;
                case NodeType.PageContainer: state = { ...state, pageContainers: EntityAdaptor.create(state.pageContainers, node) }; break;
                case NodeType.Icon: state = { ...state, icons: EntityAdaptor.create(state.icons, node) }; break;
                case NodeType.Text: state = { ...state, texts: EntityAdaptor.create(state.texts, node) }; break;
                case NodeType.RouterRoute: state = { ...state, routerRoutes: EntityAdaptor.create(state.routerRoutes, node) }; break;
            }
            const reference: DrxTemplateItem = { id: node.id, type: node.type };
            switch (targetType) {
                case NodeType.App: return { ...state, app: { ...state.app, template: [...state.app.template, reference] } };
                case NodeType.Page: return { ...state, pages: EntityAdaptor.updateById(state.pages, targetId, page => ({ template: [...page.template, reference] })) };
                case NodeType.Component: return { ...state, components: EntityAdaptor.updateById(state.components, targetId, item => ({ template: [...item.template, reference] })) };
                case NodeType.Element: return { ...state, elements: EntityAdaptor.updateById(state.elements, targetId, item => ({ template: [...item.template, reference] })) };
                case NodeType.If: return { ...state, ifs: EntityAdaptor.updateById(state.ifs, targetId, item => ({ template: [...item.template, reference] })) };
                case NodeType.ElseIf: return { ...state, elseIfs: EntityAdaptor.updateById(state.elseIfs, targetId, item => ({ template: [...item.template, reference] })) };
                case NodeType.Else: return { ...state, elses: EntityAdaptor.updateById(state.elses, targetId, item => ({ template: [...item.template, reference] })) };
                case NodeType.For: return { ...state, fors: EntityAdaptor.updateById(state.fors, targetId, item => ({ template: [...item.template, reference] })) };
                case NodeType.RouterRoute: return { ...state, routerRoutes: EntityAdaptor.updateById(state.routerRoutes, targetId, item => ({ template: [...item.template, reference] })) };
            }
        });
    }

    public removeNode(targetType: DrxTemplateTargetType, targetId: string, node: DrxTemplateItem): void {
        this.state.set(state => {
            switch (targetType) {
                case NodeType.App: state = { ...state, app: { ...state.app, template: $Array.removeWhere(state.app.template, entry => entry.id === node.id, true) } }; break;
                case NodeType.Page: state = { ...state, pages: EntityAdaptor.updateById(state.pages, targetId, page => ({ template: $Array.removeWhere(page.template, entry => entry.id === node.id, true) })) }; break;
                case NodeType.Component: state = { ...state, components: EntityAdaptor.updateById(state.components, targetId, item => ({ template: $Array.removeWhere(item.template, entry => entry.id === node.id, true) })) }; break;
                case NodeType.Element: state = { ...state, elements: EntityAdaptor.updateById(state.elements, targetId, item => ({ template: $Array.removeWhere(item.template, entry => entry.id === node.id, true) })) }; break;
                case NodeType.If: state = { ...state, ifs: EntityAdaptor.updateById(state.ifs, targetId, item => ({ template: $Array.removeWhere(item.template, entry => entry.id === node.id, true) })) }; break;
                case NodeType.ElseIf: state = { ...state, elseIfs: EntityAdaptor.updateById(state.elseIfs, targetId, item => ({ template: $Array.removeWhere(item.template, entry => entry.id === node.id, true) })) }; break;
                case NodeType.Else: state = { ...state, elses: EntityAdaptor.updateById(state.elses, targetId, item => ({ template: $Array.removeWhere(item.template, entry => entry.id === node.id, true) })) }; break;
                case NodeType.For: state = { ...state, fors: EntityAdaptor.updateById(state.fors, targetId, item => ({ template: $Array.removeWhere(item.template, entry => entry.id === node.id, true) })) }; break;
                case NodeType.RouterRoute: state = { ...state, routerRoutes: EntityAdaptor.updateById(state.routerRoutes, targetId, item => ({ template: $Array.removeWhere(item.template, entry => entry.id === node.id, true) })) }; break;
            }
            switch (node.type) {
                case NodeType.Element: return { ...state, elements: EntityAdaptor.delete(state.elements, node.id) };
                case NodeType.If: return { ...state, ifs: EntityAdaptor.delete(state.ifs, node.id) };
                case NodeType.For: return { ...state, fors: EntityAdaptor.delete(state.fors, node.id) };
                case NodeType.ComponentInstance: return { ...state, componentInstances: EntityAdaptor.delete(state.componentInstances, node.id) };
                case NodeType.PageContainer: return { ...state, pageContainers: EntityAdaptor.delete(state.pageContainers, node.id) };
                case NodeType.Icon: return { ...state, icons: EntityAdaptor.delete(state.icons, node.id) };
                case NodeType.Text: return { ...state, texts: EntityAdaptor.delete(state.texts, node.id) };
                case NodeType.RouterRoute: return { ...state, routerRoutes: EntityAdaptor.delete(state.routerRoutes, node.id) };
                default: return state;
            }
        });
    }

    public moveNode(node: DrxTemplateItem, from: { type: DrxTemplateTargetType; id: string }, to: { type: DrxTemplateTargetType; id: string }, index: number): void {
        if (node.type === NodeType.ElseIf) {
            const fromBranchIds = this.state.value.ifs[from.id].branchIds;
            if (from.id === to.id) {
                const sourceIndex = fromBranchIds.indexOf(node.id);
                const destinationIndex = sourceIndex < index ? index - 1 : index;
                this.state.reduce(reducer => [reducer.ifs.entity.updateById(to.id, () => ({ branchIds: $Array.moveAt(fromBranchIds, sourceIndex, destinationIndex) }))]);
                return;
            }
            this.state.reduce(reducer => [
                reducer.ifs.entity.updateById(from.id, item => ({ branchIds: item.branchIds.filter(id => id !== node.id) })),
                reducer.ifs.entity.updateById(to.id, item => ({ branchIds: $Array.insert(item.branchIds, index, node.id) }))
            ]);
            return;
        }
        if (node.type === NodeType.Else) {
            if (from.id === to.id || this.state.value.ifs[to.id].elseId) return;
            this.state.reduce(reducer => [
                reducer.ifs.entity.updateById(from.id, () => ({ elseId: undefined })),
                reducer.ifs.entity.updateById(to.id, () => ({ elseId: node.id }))
            ]);
            return;
        }
        this.state.set(state => {
            const getContainer = (type: DrxTemplateTargetType, id: string) => {
                switch (type) {
                    case NodeType.App: return state.app;
                    case NodeType.Page: return state.pages[id];
                    case NodeType.Component: return state.components[id];
                    case NodeType.Element: return state.elements[id];
                    case NodeType.If: return state.ifs[id];
                    case NodeType.ElseIf: return state.elseIfs[id];
                    case NodeType.Else: return state.elses[id];
                    case NodeType.For: return state.fors[id];
                    case NodeType.RouterRoute: return state.routerRoutes[id];
                }
            };
            const setTemplate = (state: DrxDocumentState, type: DrxTemplateTargetType, id: string, template: DrxTemplateItem[]): DrxDocumentState => {
                switch (type) {
                    case NodeType.App: return { ...state, app: { ...state.app, template } };
                    case NodeType.Page: return { ...state, pages: EntityAdaptor.updateById(state.pages, id, () => ({ template })) };
                    case NodeType.Component: return { ...state, components: EntityAdaptor.updateById(state.components, id, () => ({ template })) };
                    case NodeType.Element: return { ...state, elements: EntityAdaptor.updateById(state.elements, id, () => ({ template })) };
                    case NodeType.If: return { ...state, ifs: EntityAdaptor.updateById(state.ifs, id, () => ({ template })) };
                    case NodeType.ElseIf: return { ...state, elseIfs: EntityAdaptor.updateById(state.elseIfs, id, () => ({ template })) };
                    case NodeType.Else: return { ...state, elses: EntityAdaptor.updateById(state.elses, id, () => ({ template })) };
                    case NodeType.For: return { ...state, fors: EntityAdaptor.updateById(state.fors, id, () => ({ template })) };
                    case NodeType.RouterRoute: return { ...state, routerRoutes: EntityAdaptor.updateById(state.routerRoutes, id, () => ({ template })) };
                }
            };
            if (from.type === to.type && from.id === to.id) {
                const template = getContainer(from.type, from.id).template;
                const sourceIndex = template.findIndex(item => item.id === node.id);
                const destinationIndex = sourceIndex < index ? index - 1 : index;
                return setTemplate(state, from.type, from.id, $Array.moveAt(template, sourceIndex, destinationIndex));
            }
            state = setTemplate(state, from.type, from.id, $Array.removeWhere(getContainer(from.type, from.id).template, item => item.id === node.id, true));
            return setTemplate(state, to.type, to.id, $Array.insert(getContainer(to.type, to.id).template, index, node));
        });
    }

    public getNodeParent(id: string): DrxTemplateItem | undefined {
        return this.getNodeParents(id).next().value;
    }

    public *getNodeParents(id: string): Generator<DrxTemplateItem> {
        const state = this.state.value;
        const findParent = (childId: string): DrxTemplateItem | undefined => {
            const contains = (children: DrxTemplateItem[]) => children.some(child => child.id === childId);
            if (contains(DrxApp.children(state.app))) return { type: NodeType.App, id: state.app.id };
            for (const page of Object.values(state.pages)) if (contains(DrxPage.children(page))) return { type: NodeType.Page, id: page.id };
            for (const component of Object.values(state.components)) if (contains(DrxComponent.children(component))) return { type: NodeType.Component, id: component.id };
            for (const api of Object.values(state.apis)) if (contains(DrxApi.children(api))) return { type: NodeType.Api, id: api.id };
            for (const endpoint of Object.values(state.apiEndpoints)) if (contains(DrxApiEndpoint.children(endpoint))) return { type: NodeType.ApiEndpoint, id: endpoint.id };
            for (const item of Object.values(state.elements)) if (contains(DrxElement.children(item))) return { type: NodeType.Element, id: item.id };
            for (const item of Object.values(state.ifs)) if (contains(DrxIf.children(item))) return { type: NodeType.If, id: item.id };
            for (const item of Object.values(state.elseIfs)) if (contains(DrxElseIf.children(item))) return { type: NodeType.ElseIf, id: item.id };
            for (const item of Object.values(state.elses)) if (contains(DrxElse.children(item))) return { type: NodeType.Else, id: item.id };
            for (const item of Object.values(state.fors)) if (contains(DrxFor.children(item))) return { type: NodeType.For, id: item.id };
            for (const item of Object.values(state.routerRoutes)) if (contains(DrxRouterRoute.children(item))) return { type: NodeType.RouterRoute, id: item.id };
            return undefined;
        };
        for (let parent = findParent(id); parent; parent = findParent(parent.id)) yield parent;
    }

    public getNodeParentOfType(id: string, type: NodeType): DrxTemplateItem | undefined {
        for (const parent of this.getNodeParents(id)) if (parent.type === type) return parent;
    }

    public getTemplatePath(id: string): string[] {
        const path: string[] = [];
        for (const parent of this.getNodeParents(id)) {
            if (parent.type === NodeType.App || parent.type === NodeType.Page || parent.type === NodeType.Component) return path.reverse();
            path.push(parent.id);
        }
        return [];
    }

    public getLocals(target: { type: NodeType, id: string }) {
        const state = this.state.value;
        const locals: { source: 'global' | 'app-variable' | 'page-variable' | 'component-variable' | 'component-property' | 'component-event' | 'for' | 'asset', name: string, definition: TsonDefinition, shadowed?: boolean }[] = [];
        if ([NodeType.Api, NodeType.Page, NodeType.Element, NodeType.For, NodeType.If, NodeType.Icon, NodeType.PageContainer, NodeType.Text, NodeType.ComponentInstance, NodeType.RouterRoute].includes(target.type)) {
            for (const asset of state.app.assetIds.map(id => state.assets[id])) {
                locals.push({
                    source: 'asset',
                    name: asset.name,
                    definition: $Tson.string()
                });
            }
        }
        if ([NodeType.Element, NodeType.For, NodeType.If, NodeType.Icon, NodeType.PageContainer, NodeType.Text, NodeType.ComponentInstance, NodeType.RouterRoute].includes(target.type)) {
            const parents: DrxTemplateItem[] = [];
            for (const parent of this.getNodeParents(target.id)) {
                parents.unshift(parent);
                if (parent.type === NodeType.Component) break;
            }
            for (const parent of parents) {
                if (parent.type === NodeType.App) {
                    const appVariableLocals = state.app.variableIds
                        .map(id => state.variables[id])
                        .map(variable => ({
                            source: 'app-variable' as const,
                            name: variable.name,
                            definition: DrxType.resolve({ type: 'app' }, variable.type, state)
                        }));
                    locals.push(...appVariableLocals);
                    locals.push({
                        source: 'global',
                        name: 'router',
                        definition: $Tson.object({ properties: { route: $Tson.string(), params: $Tson.record({ property: $Tson.string() }) } })
                    });
                    locals.push({
                        source: 'global',
                        name: 'modal',
                        definition: $Tson.object({ properties: { data: $Tson.any({ default: { value: undefined } }) } })
                    });
                } else if (parent.type === NodeType.Page) {
                    const pageVariableLocals = state.pages[parent.id].variableIds
                        .map(id => state.variables[id])
                        .map(variable => ({
                            source: 'page-variable' as const,
                            name: variable.name,
                            definition: DrxType.resolve({ type: 'app' }, variable.type, state)
                        }));
                    locals.push(...pageVariableLocals);
                } else if (parent.type === NodeType.Component) {
                    const componentScope: DrxScope = { type: 'component', componentId: parent.id };
                    const componentVariableLocals = state.components[parent.id].variableIds
                        .map(id => state.variables[id])
                        .map(variable => ({
                            source: 'component-variable' as const,
                            name: variable.name,
                            definition: DrxType.resolve(componentScope, variable.type, state)
                        }));
                    locals.push(...componentVariableLocals);
                    const componentPropertyLocals = state.components[parent.id].propertyIds
                        .map(id => state.componentProperties[id])
                        .map(property => ({
                            source: 'component-property' as const,
                            name: property.name,
                            definition: DrxType.resolve(componentScope, property.type, state)
                        }));
                    locals.push(...componentPropertyLocals);
                    const componentEventLocals = state.components[parent.id].eventIds
                        .map(id => state.componentEvents[id])
                        .map(event => ({
                            source: 'component-event' as const,
                            name: event.name,
                            definition: $Tson.any()
                        }));
                    locals.push(...componentEventLocals);
                } else if (parent.type === NodeType.For) {
                    const forNode = state.fors[parent.id];
                    const eachLocal = DrxExpression.isPureLocal(forNode.each);
                    const eachDefinition = eachLocal && locals.find(local => local.name === eachLocal.name)?.definition;
                    const itemDefinition = eachDefinition && $Tson.getDefinitionAtPath(eachDefinition, eachLocal.path);
                    locals.push({ source: 'for', name: forNode.as, definition: itemDefinition?.type === 'array' ? (itemDefinition.itemDefinition ?? $Tson.any()) : $Tson.any() });
                    if (forNode.index) locals.push({ source: 'for', name: forNode.index, definition: $Tson.number() });
                    if (forNode.key) locals.push({ source: 'for', name: forNode.key, definition: $Tson.string() });
                }
            }
        }
        return locals.map((local, index) => ({
            ...local,
            shadowed: local.source !== 'asset' && locals.slice(index + 1).some(other => other.source !== 'asset' && other.name === local.name)
        }));
    }

    public toFormattedString(): string {
        function formatNode(node: Node, depth: number): string[] {
            const indent = '    ';
            const escapeText = (value: string) => value
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
            const prefix = indent.repeat(depth);
            if (node.nodeType === Node.COMMENT_NODE) return [`${prefix}<!--${node.textContent}-->`];
            if (node.nodeType === Node.TEXT_NODE) {
                const text = (node.textContent ?? '').trim();
                if (!text) return [];
                try {
                    return JSON
                        .stringify(JSON.parse(text), null, indent)
                        .split('\n')
                        .map(line => `${prefix}${escapeText(line)}`);
                } catch {
                    return [`${prefix}${escapeText(text)}`];
                }
            }
            const element = node as Element;
            const tag = element.tagName.toLowerCase();
            const attributes = Array
                .from(element.attributes)
                .map(attribute => ` ${attribute.name}="${attribute.value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"`)
                .join('');
            if (['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'].includes(tag)) return [`${prefix}<${tag}${attributes}>`];
            if (tag === 'script' || tag === 'style') {
                const contentLines = (element.textContent ?? '').split('\n').map(line => line.trim());
                while (contentLines.length && contentLines[0] === '') contentLines.shift();
                while (contentLines.length && contentLines[contentLines.length - 1] === '') contentLines.pop();

                const stack: { char: string; absorbed: boolean }[] = [];
                let quote: string | undefined;
                let blockComment = false;
                const formatted: string[] = [];
                const getDepth = () => stack.reduce((total, opener) => total + (opener.absorbed ? 0 : 1), 0);

                for (const line of contentLines) {
                    if (line === '') { formatted.push(''); continue; }
                    let lineIndent: number | undefined;

                    for (let i = 0; i < line.length; i++) {
                        if (blockComment) {
                            if (line[i] === '*' && line[i + 1] === '/') { blockComment = false; i++; }
                            continue;
                        }
                        if (quote) {
                            if (line[i] === '\\') i++;
                            else if (line[i] === quote) quote = undefined;
                            continue;
                        }
                        if (line[i] === '/' && line[i + 1] === '/') break;
                        if (line[i] === '/' && line[i + 1] === '*') { blockComment = true; i++; continue; }
                        if (line[i] === '"' || line[i] === '\'' || line[i] === '`') { quote = line[i]; continue; }

                        if (lineIndent === undefined && !['}', ')', ']'].includes(line[i])) lineIndent = getDepth();

                        if (line[i] === '{' || line[i] === '(' || line[i] === '[') {
                            const parent = stack[stack.length - 1];
                            if (line[i] !== '(' && parent && parent.char === '(' && !parent.absorbed) parent.absorbed = true;
                            stack.push({ char: line[i], absorbed: false });
                        } else if (['}', ')', ']'].includes(line[i])) {
                            stack.pop();
                        }
                    }
                    if (lineIndent === undefined) lineIndent = getDepth();
                    formatted.push(indent.repeat(Math.max(lineIndent, 0)) + line);
                }
                const content = formatted.join('\n');
                if (!content) return [`${prefix}<${tag}${attributes}></${tag}>`];
                const inner = content.split('\n').map(line => line ? indent.repeat(depth + 1) + line : '');
                return [`${prefix}<${tag}${attributes}>`, ...inner, `${prefix}</${tag}>`];
            }
            const nodes = Array
                .from(element.childNodes)
                .filter(child => child.nodeType !== Node.TEXT_NODE || child.textContent !== '');
            const textOf = (child: Node) => child.nodeType === Node.TEXT_NODE ? child.textContent : '';
            if (nodes.length && (/^\s/.test(textOf(nodes[0])) || /\s$/.test(textOf(nodes[nodes.length - 1])))) return [`${prefix}${element.outerHTML}`];
            const groups: Node[][] = [];
            for (const child of nodes) {
                const previous = groups[groups.length - 1];
                if (previous && (/\s$/.test(textOf(previous[previous.length - 1])) || /^\s/.test(textOf(child)))) previous.push(child);
                else groups.push([child]);
            }
            const children = groups.flatMap(group => group.length === 1
                ? formatNode(group[0], depth + 1)
                : [`${indent.repeat(depth + 1)}${group.map(child => child.nodeType === Node.TEXT_NODE ? escapeText(child.textContent) : (child as Element).outerHTML).join('')}`]);
            if (children.length === 0) return [`${prefix}<${tag}${attributes}></${tag}>`];
            return [`${prefix}<${tag}${attributes}>`, ...children, `${prefix}</${tag}>`];
        }
        const dom = new DOMParser().parseFromString(this.toString(), 'text/html');
        const lines: string[] = [];
        for (const node of dom.body.childNodes) {
            for (const line of formatNode(node, 0)) lines.push(line);
        }
        return lines.join('\n');
    }
}
