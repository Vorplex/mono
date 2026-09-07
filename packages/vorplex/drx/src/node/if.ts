import { $Id, Signal } from '@vorplex/core';
import { ExpressionParser } from '../expression-parser';
import { PreviewContext } from '../preview-context';
import { RenderContext } from '../render-context';
import { DrxDocumentState } from '../drx';
import { DrxDom } from '../drx-dom';
import { NodeType } from './node-type';
import { DrxTemplate, DrxTemplateItem } from './template-item';

export interface DrxIf {
    id: string;
    type: NodeType.If;
    condition: string;
    template: DrxTemplateItem[];
}

export const DrxIf = {
    from(parent: Element, state: DrxDocumentState): DrxTemplateItem[] {
        const elements = Array.from(parent.querySelectorAll(`:scope > ${NodeType.If}`));
        return elements.map(element => DrxIf.parse(element, state));
    },
    parse(element: Element, state: DrxDocumentState): DrxTemplateItem {
        const item: DrxIf = {
            id: DrxDom.getAttribute(element, 'id') ?? $Id.guid(),
            type: NodeType.If,
            condition: DrxDom.getRequiredAttribute(element, 'condition'),
            template: DrxTemplate.from(element, state)
        };
        state.ifs[item.id] = item;
        return { id: item.id, type: item.type };
    },
    to(item: DrxIf, state: DrxDocumentState): Element {
        const element = document.createElement(NodeType.If);
        element.setAttribute('id', item.id);
        element.setAttribute('condition', item.condition);
        for (const child of DrxTemplate.to(item.template, state)) element.appendChild(child);
        return element;
    },
    mount(container: Node, item: DrxIf, context: RenderContext): void {
        const host = document.createElement(NodeType.If);
        host.style.display = 'contents';
        container.appendChild(host);
        ExpressionParser.bind(item.condition, context.locals, active => {
            if (active) DrxTemplate.mount(host, item.template, context);
        });
        Signal.cleanup(() => host.remove());
    },
    preview(container: Node, id: string, context: PreviewContext): Node {
        const host = document.createElement(NodeType.If);
        host.style.display = 'contents';
        container.appendChild(host);
        DrxTemplate.preview(host, () => context.root.proxy.ifs[id].template(), context);
        Signal.cleanup(() => host.remove());
        return host;
    }
};
