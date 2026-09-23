import { $Id, Signal } from '@vorplex/core';
import { DrxDocumentState } from '../../drx';
import { DrxDom } from '../../drx-dom';
import { PreviewContext } from '../../preview-context';
import { NodeType } from '../node-type';
import { DrxTemplate, DrxTemplateItem } from '../template-item';

export interface DrxElseIf {
    id: string;
    condition: string;
    template: DrxTemplateItem[];
}

export const DrxElseIf = {
    from(parent: Element, state: DrxDocumentState): DrxElseIf[] {
        const elements = Array.from(parent.querySelectorAll(`:scope > ${NodeType.ElseIf}`));
        return elements.map(element => DrxElseIf.parse(element, state));
    },
    parse(element: Element, state: DrxDocumentState): DrxElseIf {
        const item: DrxElseIf = {
            id: DrxDom.getAttribute(element, 'id') ?? $Id.guid(),
            condition: DrxDom.getRequiredAttribute(element, 'condition'),
            template: DrxTemplate.from(element, state)
        };
        state.elseIfs[item.id] = item;
        return item;
    },
    to(item: DrxElseIf, state: DrxDocumentState): Element {
        const element = document.createElement(NodeType.ElseIf);
        DrxDom.setAttribute(element, 'id', item.id);
        DrxDom.setAttribute(element, 'condition', item.condition);
        for (const child of DrxTemplate.to(item.template, state)) element.appendChild(child);
        return element;
    },
    preview(container: Node, id: string, context: PreviewContext): Node {
        const host = document.createElement(NodeType.ElseIf);
        host.style.display = 'contents';
        host.setAttribute('data-drx-id', id);
        container.appendChild(host);
        DrxTemplate.preview(host, () => context.root.proxy.elseIfs[id].template(), context);
        Signal.cleanup(() => host.remove());
        return host;
    }
};
