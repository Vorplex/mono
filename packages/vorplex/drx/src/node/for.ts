import { $Id, $Value, Signal } from '@vorplex/core';
import { ExpressionParser } from '../expression-parser';
import { PreviewContext } from '../preview-context';
import { RenderContext } from '../render-context';
import { DrxDocumentState } from '../drx';
import { DrxDom } from '../drx-dom';
import { NodeType } from './node-type';
import { DrxTemplate, DrxTemplateItem } from './template-item';

export interface DrxFor {
    id: string;
    type: NodeType.For;
    each: string;
    as: string;
    index?: string;
    key?: string;
    track?: string;
    template: DrxTemplateItem[];
}

export const DrxFor = {
    from(parent: Element, state: DrxDocumentState): DrxTemplateItem[] {
        const elements = Array.from(parent.querySelectorAll(`:scope > ${NodeType.For}`));
        return elements.map(element => DrxFor.parse(element, state));
    },
    parse(element: Element, state: DrxDocumentState): DrxTemplateItem {
        const item: DrxFor = {
            id: DrxDom.getAttribute(element, 'id') ?? $Id.guid(),
            type: NodeType.For,
            each: DrxDom.getRequiredAttribute(element, 'each'),
            as: DrxDom.getRequiredAttribute(element, 'as'),
            index: DrxDom.getAttribute(element, 'index'),
            key: DrxDom.getAttribute(element, 'key'),
            track: DrxDom.getAttribute(element, 'track'),
            template: DrxTemplate.from(element, state)
        };
        state.fors[item.id] = item;
        return { id: item.id, type: item.type };
    },
    to(item: DrxFor, state: DrxDocumentState): Element {
        const element = document.createElement(NodeType.For);
        DrxDom.setAttribute(element, 'id', item.id);
        DrxDom.setAttribute(element, 'each', item.each);
        DrxDom.setAttribute(element, 'as', item.as);
        if (item.index) DrxDom.setAttribute(element, 'index', item.index);
        if (item.key) DrxDom.setAttribute(element, 'key', item.key);
        if (item.track) DrxDom.setAttribute(element, 'track', item.track);
        for (const child of DrxTemplate.to(item.template, state)) element.appendChild(child);
        return element;
    },
    mount(container: Node, item: DrxFor, context: RenderContext): void {
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
                DrxTemplate.mount(itemHost, item.template, RenderContext.withLocals(context, locals));
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
        DrxTemplate.preview(host, () => context.root.proxy.fors[id].template(), context);
        Signal.cleanup(() => host.remove());
        return host;
    }
};
