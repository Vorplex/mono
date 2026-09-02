import { $Id, Signal } from '@vorplex/core';
import { ExpressionParser } from '../expression-parser';
import { PreviewContext } from '../preview-context';
import { RenderContext } from '../render-context';
import { ShtmlDocumentState } from '../shtml';
import { ShtmlDom } from '../shtml-dom';
import { NodeType } from './node-type';
import { ShtmlTemplate, ShtmlTemplateItem } from './template-item';

export interface ShtmlIf {
    id: string;
    type: NodeType.If;
    condition: string;
    template: ShtmlTemplateItem[];
}

export const ShtmlIf = {
    from(parent: Element, state: ShtmlDocumentState): ShtmlTemplateItem[] {
        const elements = Array.from(parent.querySelectorAll(`:scope > ${NodeType.If}`));
        return elements.map(element => ShtmlIf.parse(element, state));
    },
    parse(element: Element, state: ShtmlDocumentState): ShtmlTemplateItem {
        const item: ShtmlIf = {
            id: ShtmlDom.getAttribute(element, 'id') ?? $Id.guid(),
            type: NodeType.If,
            condition: ShtmlDom.getRequiredAttribute(element, 'condition'),
            template: ShtmlTemplate.from(element, state)
        };
        state.ifs[item.id] = item;
        return { id: item.id, type: item.type };
    },
    to(item: ShtmlIf, state: ShtmlDocumentState): Element {
        const element = document.createElement(NodeType.If);
        element.setAttribute('id', item.id);
        element.setAttribute('condition', item.condition);
        for (const child of ShtmlTemplate.to(item.template, state)) element.appendChild(child);
        return element;
    },
    mount(container: Node, item: ShtmlIf, context: RenderContext): void {
        const host = document.createElement(NodeType.If);
        host.style.display = 'contents';
        container.appendChild(host);
        ExpressionParser.bind(item.condition, context.locals, active => {
            if (active) ShtmlTemplate.mount(host, item.template, context);
        });
        Signal.cleanup(() => host.remove());
    },
    preview(container: Node, id: string, context: PreviewContext): Node {
        const host = document.createElement(NodeType.If);
        host.style.display = 'contents';
        container.appendChild(host);
        ShtmlTemplate.preview(host, () => context.root.proxy.ifs[id].template(), context);
        Signal.cleanup(() => host.remove());
        return host;
    }
};
