import { $Id, $Value, Signal } from '@vorplex/core';
import { ExpressionParser } from '../expression-parser';
import { PreviewContext } from '../preview-context';
import { RenderContext } from '../render-context';
import { ShtmlDocumentState } from '../shtml';
import { ShtmlDom } from '../shtml-dom';
import { NodeType } from './node-type';
import { ShtmlTemplate, ShtmlTemplateItem } from './template-item';

export interface ShtmlFor {
    id: string;
    type: NodeType.For;
    each: string;
    as: string;
    index?: string;
    key?: string;
    track?: string;
    template: ShtmlTemplateItem[];
}

export const ShtmlFor = {
    from(parent: Element, state: ShtmlDocumentState): ShtmlTemplateItem[] {
        const elements = Array.from(parent.querySelectorAll(`:scope > ${NodeType.For}`));
        return elements.map(element => ShtmlFor.parse(element, state));
    },
    parse(element: Element, state: ShtmlDocumentState): ShtmlTemplateItem {
        const item: ShtmlFor = {
            id: ShtmlDom.getAttribute(element, 'id') ?? $Id.guid(),
            type: NodeType.For,
            each: ShtmlDom.getRequiredAttribute(element, 'each'),
            as: ShtmlDom.getRequiredAttribute(element, 'as'),
            index: ShtmlDom.getAttribute(element, 'index'),
            key: ShtmlDom.getAttribute(element, 'key'),
            track: ShtmlDom.getAttribute(element, 'track'),
            template: ShtmlTemplate.from(element, state)
        };
        state.fors[item.id] = item;
        return { id: item.id, kind: item.type };
    },
    to(item: ShtmlFor, state: ShtmlDocumentState): Element {
        const element = document.createElement(NodeType.For);
        element.setAttribute('id', item.id);
        element.setAttribute('each', item.each);
        element.setAttribute('as', item.as);
        if (item.index) element.setAttribute('index', item.index);
        if (item.key) element.setAttribute('key', item.key);
        if (item.track) element.setAttribute('track', item.track);
        for (const child of ShtmlTemplate.to(item.template, state)) element.appendChild(child);
        return element;
    },
    mount(container: Node, item: ShtmlFor, context: RenderContext): void {
        const host = document.createElement(NodeType.For);
        host.style.display = 'contents';
        container.appendChild(host);
        const entries = Signal.keyed(
            () => ExpressionParser.parse(item.each, context.locals),
            entry => item.track ? $Value.get(entry.value, item.track) : entry.key,
            entry => {
                const itemHost = document.createElement(NodeType.For);
                itemHost.style.display = 'contents';
                const locals: Record<string, any> = { [item.as]: entry.proxy.value };
                if (item.index) locals[item.index] = entry.proxy.index;
                if (item.key) locals[item.key] = entry.proxy.key;
                ShtmlTemplate.mount(itemHost, item.template, RenderContext.withLocals(context, locals));
                Signal.cleanup(() => itemHost.remove());
                return itemHost;
            }
        );
        Signal.effect(() => {
            for (const entry of entries()) host.appendChild(entry);
        });
        Signal.cleanup(() => host.remove());
    },
    preview(container: Node, id: string, context: PreviewContext): Node {
        const host = document.createElement(NodeType.For);
        host.style.display = 'contents';
        container.appendChild(host);
        ShtmlTemplate.preview(host, () => context.root.proxy.fors[id].template(), context);
        Signal.cleanup(() => host.remove());
        return host;
    }
};
