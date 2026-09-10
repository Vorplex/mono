import { $Array, Awaitable, EntityAdaptor, EntityMap, Getter, Scope, Signal, State, TsonDefinition } from '@vorplex/core';
import { IconSheet } from './icon-sheet';
import { ImportResolver } from './import-resolver';
import { DrxApi } from './node/api/api';
import { DrxApiBody } from './node/api/body';
import { DrxApiEndpoint } from './node/api/endpoint';
import { DrxApiHeader } from './node/api/header';
import { DrxApiParameter } from './node/api/parameter';
import { DrxApiResponse } from './node/api/response';
import { DrxApp } from './node/app';
import { DrxAsset } from './node/asset';
import { DrxComponent } from './node/component/component';
import { DrxComponentEvent } from './node/component/event';
import { DrxComponentInstance } from './node/component/instance';
import { DrxComponentProperty } from './node/component/property';
import { DrxElement } from './node/element';
import { DrxFor } from './node/for';
import { DrxIcon } from './node/icon';
import { DrxIf } from './node/if';
import { NodeType } from './node/node-type';
import { DrxPage } from './node/page';
import { DrxPageContainer } from './node/page-container';
import { DrxService } from './node/service';
import { DrxTemplateItem, DrxTemplateNode, DrxTemplateTargetType } from './node/template-item';
import { DrxText } from './node/text';
import { DrxType } from './node/type';
import { DrxVariable } from './node/variable';
import { PreviewContext } from './preview-context';
import { ScriptCompiler } from './script-compiler';
import { StyleSheet } from './style-sheet';
import { validators, type DrxProblem } from './validation';

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
    fors: EntityMap<DrxFor>;
    componentProperties: EntityMap<DrxComponentProperty>;
    componentEvents: EntityMap<DrxComponentEvent>;
    componentInstances: EntityMap<DrxComponentInstance>;
    pageContainers: EntityMap<DrxPageContainer>;
    icons: EntityMap<DrxIcon>;
    apis: EntityMap<DrxApi>;
    apiEndpoints: EntityMap<DrxApiEndpoint>;
    apiParameters: EntityMap<DrxApiParameter>;
    apiHeaders: EntityMap<DrxApiHeader>;
    apiBodies: EntityMap<DrxApiBody>;
    apiResponses: EntityMap<DrxApiResponse>;
}

export class DrxDocument {

    public readonly state: State<DrxDocumentState>;

    constructor(state: DrxDocumentState) {
        this.state = new State<DrxDocumentState>(state);
    }

    public validate(): DrxProblem[] {
        const state = this.state.value;
        const problems: DrxProblem[] = [];
        for (const group of Object.values(validators)) {
            for (const validate of Object.values(group)) {
                try {
                    problems.push(...(validate as (state: DrxDocumentState) => DrxProblem[])(state));
                } catch (error) {
                    problems.push({ severity: 'error', code: 'DRX000', message: `Validator crashed: ${error instanceof Error ? error.message : String(error)}`, target: { type: NodeType.App, id: state.app.id } });
                }
            }
        }
        return problems;
    }

    public static async fetch(url: string): Promise<DrxDocument> {
        const base = url.slice(0, url.lastIndexOf('/') + 1);
        const source = await fetch(url).then(response => response.text());
        return DrxDocument.load(source, { import: path => fetch(base + path).then(response => response.text()) });
    }

    public static async load(drx: string, options: { import: (path: string) => Awaitable<string> }): Promise<DrxDocument> {
        const dom = await ImportResolver.resolve(drx, options.import);
        return DrxDocument.from(dom);
    }

    public static parse(drx: string): DrxDocument {
        return DrxDocument.from(new DOMParser().parseFromString(drx, 'text/html'));
    }

    public static from(dom: Document): DrxDocument {
        const state: DrxDocumentState = {
            app: null,
            pages: {},
            variables: {},
            services: {},
            assets: {},
            components: {},
            types: {},
            elements: {},
            texts: {},
            ifs: {},
            fors: {},
            componentProperties: {},
            componentEvents: {},
            componentInstances: {},
            pageContainers: {},
            icons: {},
            apis: {},
            apiEndpoints: {},
            apiParameters: {},
            apiHeaders: {},
            apiBodies: {},
            apiResponses: {}
        };
        return new DrxDocument({
            ...state,
            app: DrxApp.from(dom, state),
        });
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
            }
            const reference: DrxTemplateItem = { id: node.id, type: node.type };
            switch (targetType) {
                case NodeType.Page: return { ...state, pages: EntityAdaptor.updateById(state.pages, targetId, page => ({ template: [...page.template, reference] })) };
                case NodeType.Component: return { ...state, components: EntityAdaptor.updateById(state.components, targetId, item => ({ template: [...item.template, reference] })) };
                case NodeType.Element: return { ...state, elements: EntityAdaptor.updateById(state.elements, targetId, item => ({ template: [...item.template, reference] })) };
                case NodeType.If: return { ...state, ifs: EntityAdaptor.updateById(state.ifs, targetId, item => ({ template: [...item.template, reference] })) };
                case NodeType.For: return { ...state, fors: EntityAdaptor.updateById(state.fors, targetId, item => ({ template: [...item.template, reference] })) };
            }
        });
    }

    public removeNode(targetType: DrxTemplateTargetType, targetId: string, node: DrxTemplateItem): void {
        this.state.set(state => {
            switch (targetType) {
                case NodeType.Page: state = { ...state, pages: EntityAdaptor.updateById(state.pages, targetId, page => ({ template: $Array.removeWhere(page.template, entry => entry.id === node.id, true) })) }; break;
                case NodeType.Component: state = { ...state, components: EntityAdaptor.updateById(state.components, targetId, item => ({ template: $Array.removeWhere(item.template, entry => entry.id === node.id, true) })) }; break;
                case NodeType.Element: state = { ...state, elements: EntityAdaptor.updateById(state.elements, targetId, item => ({ template: $Array.removeWhere(item.template, entry => entry.id === node.id, true) })) }; break;
                case NodeType.If: state = { ...state, ifs: EntityAdaptor.updateById(state.ifs, targetId, item => ({ template: $Array.removeWhere(item.template, entry => entry.id === node.id, true) })) }; break;
                case NodeType.For: state = { ...state, fors: EntityAdaptor.updateById(state.fors, targetId, item => ({ template: $Array.removeWhere(item.template, entry => entry.id === node.id, true) })) }; break;
            }
            switch (node.type) {
                case NodeType.Element: return { ...state, elements: EntityAdaptor.delete(state.elements, node.id) };
                case NodeType.If: return { ...state, ifs: EntityAdaptor.delete(state.ifs, node.id) };
                case NodeType.For: return { ...state, fors: EntityAdaptor.delete(state.fors, node.id) };
                case NodeType.ComponentInstance: return { ...state, componentInstances: EntityAdaptor.delete(state.componentInstances, node.id) };
                case NodeType.PageContainer: return { ...state, pageContainers: EntityAdaptor.delete(state.pageContainers, node.id) };
                case NodeType.Icon: return { ...state, icons: EntityAdaptor.delete(state.icons, node.id) };
                case NodeType.Text: return { ...state, texts: EntityAdaptor.delete(state.texts, node.id) };
                default: return state;
            }
        });
    }

    public moveNode(node: DrxTemplateItem, from: { type: DrxTemplateTargetType; id: string }, to: { type: DrxTemplateTargetType; id: string }, index: number): void {
        this.state.set(state => {
            const getContainer = (type: DrxTemplateTargetType, id: string) => {
                switch (type) {
                    case NodeType.Page: return state.pages[id];
                    case NodeType.Component: return state.components[id];
                    case NodeType.Element: return state.elements[id];
                    case NodeType.If: return state.ifs[id];
                    case NodeType.For: return state.fors[id];
                }
            };
            const setTemplate = (state: DrxDocumentState, type: DrxTemplateTargetType, id: string, template: DrxTemplateItem[]): DrxDocumentState => {
                switch (type) {
                    case NodeType.Page: return { ...state, pages: EntityAdaptor.updateById(state.pages, id, () => ({ template })) };
                    case NodeType.Component: return { ...state, components: EntityAdaptor.updateById(state.components, id, () => ({ template })) };
                    case NodeType.Element: return { ...state, elements: EntityAdaptor.updateById(state.elements, id, () => ({ template })) };
                    case NodeType.If: return { ...state, ifs: EntityAdaptor.updateById(state.ifs, id, () => ({ template })) };
                    case NodeType.For: return { ...state, fors: EntityAdaptor.updateById(state.fors, id, () => ({ template })) };
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

    public getNodeParent(id: string): { type: NodeType; id: string } | undefined {
        const state = this.state.value;
        if (state.app.pageIds.includes(id) || state.app.componentIds.includes(id)) return { type: NodeType.App, id: state.app.id };
        const references = (template: DrxTemplateItem[]) => template.some(item => item.id === id);
        for (const page of Object.values(state.pages)) if (references(page.template)) return { type: NodeType.Page, id: page.id };
        for (const component of Object.values(state.components)) {
            if (references(component.template) || component.componentIds.includes(id)) return { type: NodeType.Component, id: component.id };
        }
        for (const element of Object.values(state.elements)) if (references(element.template)) return { type: NodeType.Element, id: element.id };
        for (const item of Object.values(state.ifs)) if (references(item.template)) return { type: NodeType.If, id: item.id };
        for (const item of Object.values(state.fors)) if (references(item.template)) return { type: NodeType.For, id: item.id };
        return undefined;
    }

    public getTemplatePath(id: string): string[] {
        const path: string[] = [];
        const visited = new Set<string>([id]);
        let parent = this.getNodeParent(id);
        while (parent && !visited.has(parent.id)) {
            if (parent.type === NodeType.Page || parent.type === NodeType.Component) return path.reverse();
            if (parent.type === NodeType.App) return [];
            visited.add(parent.id);
            path.push(parent.id);
            parent = this.getNodeParent(parent.id);
        }
        return [];
    }

    public getNodeParentOfType(id: string, type: NodeType): { type: NodeType; id: string } | undefined {
        let current = this.getNodeParent(id);
        while (current) {
            if (current.type === type) return current;
            if (current.type === NodeType.App) return undefined;
            current = this.getNodeParent(current.id);
        }
        return undefined;
    }

    public async mount(target: Element): Promise<Scope> {
        const state = this.state.value;
        IconSheet.load();
        const compiled = await ScriptCompiler.compile(state);
        return DrxApp.mount(target, state.app, state, compiled);
    }

    public async preview(container: Element, options: { target: { type: 'page' | 'component', id: string }, resolveAsset?: (asset: DrxAsset) => string, styleSheets?: Getter<string | undefined>[] }): Promise<{ dispose: () => void }> {
        IconSheet.load();
        const scope = Signal.root(() => {
            const context: PreviewContext = {
                root: this.state.signal,
                resolveAsset: options.resolveAsset,
                styleSheets: (options.styleSheets ?? []).map(css => StyleSheet.create(container.ownerDocument.defaultView, css))
            };
            if (options.target.type === 'component') {
                DrxComponent.preview(container, options.target.id, context);
            } else {
                DrxPage.preview(container, options.target.id, context);
            }
        });
        return { dispose: () => scope.dispose() };
    }

    public getLocals(targetId: string): Record<string, TsonDefinition> {
        const proxy = this.state.signal.proxy;
        const state = this.state.value;
        const app = proxy.app;

        const walkTemplate = (template: DrxTemplateItem[], forLocals: [string, TsonDefinition][]): [string, TsonDefinition][] | undefined => {
            for (const item of template) {
                if (item.id === targetId) return forLocals;
                if (item.type === NodeType.Element) {
                    const found = walkTemplate(proxy.elements[item.id].template(), forLocals);
                    if (found) return found;
                } else if (item.type === NodeType.If) {
                    const found = walkTemplate(proxy.ifs[item.id].template(), forLocals);
                    if (found) return found;
                } else if (item.type === NodeType.For) {
                    const forNode = proxy.fors[item.id];
                    const added: [string, TsonDefinition][] = [[forNode.as() || 'item', { type: 'any' }]];
                    if (forNode.index()) added.push([forNode.index(), { type: 'any' }]);
                    if (forNode.key()) added.push([forNode.key(), { type: 'any' }]);
                    const found = walkTemplate(forNode.template(), [...forLocals, ...added]);
                    if (found) return found;
                }
            }
            return undefined;
        };

        const resolveVariables = (variableIds: string[], scope: DrxScope): [string, TsonDefinition][] =>
            variableIds.map(id => [proxy.variables[id].name(), DrxType.resolve(scope, proxy.variables[id].type(), state)]);

        for (const pageId of app.pageIds()) {
            const page = proxy.pages[pageId];
            const forLocals = walkTemplate(page.template(), []);
            if (!forLocals) continue;
            const scope: DrxScope = { type: 'app' };
            const reserved: [string, TsonDefinition][] = [['asset', { type: 'any' }], ['modal', { type: 'any' }]];
            if (app.router()) reserved.push(['router', { type: 'any' }]);
            return Object.fromEntries([
                ...resolveVariables(app.variableIds(), scope),
                ...resolveVariables(page.variableIds(), scope),
                ...forLocals,
                ...reserved
            ]);
        }

        const findInComponents = (componentIds: string[]): Record<string, TsonDefinition> | undefined => {
            for (const componentId of componentIds) {
                const component = proxy.components[componentId];
                const forLocals = walkTemplate(component.template(), []);
                if (forLocals) {
                    const scope: DrxScope = { type: 'component', componentId };
                    const propertyLocals: [string, TsonDefinition][] = component.propertyIds()
                        .map(id => [proxy.componentProperties[id].name(), DrxType.resolve(scope, proxy.componentProperties[id].type(), state)]);
                    return Object.fromEntries([
                        ...resolveVariables(component.variableIds(), scope),
                        ...propertyLocals,
                        ...forLocals,
                        ['asset', { type: 'any' }]
                    ]);
                }
                const nested = findInComponents(component.componentIds());
                if (nested) return nested;
            }
            return undefined;
        };

        return findInComponents(app.componentIds()) ?? {};
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
            const children: string[] = [];
            for (const child of element.childNodes) {
                children.push(...formatNode(child, depth + 1));
            }
            if (children.length === 0) return [`${prefix}<${tag}${attributes}></${tag}>`];
            return [`${prefix}<${tag}${attributes}>`, ...children, `${prefix}</${tag}>`];
        }
        const dom = new DOMParser().parseFromString(this.toString(), 'text/html');
        const lines: string[] = [];
        for (const node of dom.body.childNodes) {
            lines.push(...formatNode(node, 0));
        }
        return lines.join('\n');
    }

}
