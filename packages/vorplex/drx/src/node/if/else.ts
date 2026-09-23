import { $Id, Signal } from '@vorplex/core';
import { DrxDocumentState } from '../../drx';
import { DrxDom } from '../../drx-dom';
import { PreviewContext } from '../../preview-context';
import { NodeType } from '../node-type';
import { DrxTemplate, DrxTemplateItem } from '../template-item';

export interface DrxElse {
    id: string;
    template: DrxTemplateItem[];
}

export const DrxElse = {
    from(parent: Element, state: DrxDocumentState): DrxElse | undefined {
        const element = DrxDom.getNode(parent, NodeType.Else);
        return element ? DrxElse.parse(element, state) : undefined;
    },
    parse(element: Element, state: DrxDocumentState): DrxElse {
        const item: DrxElse = {
            id: DrxDom.getAttribute(element, 'id') ?? $Id.guid(),
            template: DrxTemplate.from(element, state)
        };
        state.elses[item.id] = item;
        return item;
    },
    to(item: DrxElse, state: DrxDocumentState): Element {
        const element = document.createElement(NodeType.Else);
        DrxDom.setAttribute(element, 'id', item.id);
        for (const child of DrxTemplate.to(item.template, state)) element.appendChild(child);
        return element;
    },
    preview(container: Node, id: string, context: PreviewContext): Node {
        const host = document.createElement(NodeType.Else);
        host.style.display = 'contents';
        host.setAttribute('data-drx-id', id);
        container.appendChild(host);
        DrxTemplate.preview(host, () => context.root.proxy.elses[id].template(), context);
        Signal.cleanup(() => host.remove());
        return host;
    }
};
