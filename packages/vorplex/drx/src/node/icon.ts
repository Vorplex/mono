import { $Id, Signal } from '@vorplex/core';
import { ExpressionParser } from '../expression-parser';
import { IconSheet } from '../icon-sheet';
import { PreviewContext } from '../preview-context';
import { RenderContext } from '../render-context';
import { DrxDocumentState } from '../drx';
import { DrxDom } from '../drx-dom';
import { NodeType } from './node-type';
import { DrxTemplateItem } from './template-item';

export interface DrxIcon {
    id: string;
    type: NodeType.Icon;
    name: string;
    attributes: Record<string, string>;
}

export const DrxIcon = {
    from(parent: Element, state: DrxDocumentState): DrxTemplateItem[] {
        const elements = Array.from(parent.querySelectorAll(`:scope > ${NodeType.Icon}`));
        return elements.map(element => DrxIcon.parse(element, state));
    },
    parse(element: Element, state: DrxDocumentState): DrxTemplateItem {
        const item: DrxIcon = {
            id: DrxDom.getAttribute(element, 'id') ?? $Id.guid(),
            type: NodeType.Icon,
            name: DrxDom.getRequiredAttribute(element, 'name'),
            attributes: element.getAttributeNames()
                .filter(name => name !== 'name' && name !== 'id')
                .reduce((attributes, name) => Object.assign(attributes, { [name]: element.getAttribute(name) }), {})
        };
        state.icons[item.id] = item;
        return { id: item.id, type: item.type };
    },
    to(item: DrxIcon): Element {
        const element = document.createElement(NodeType.Icon);
        DrxDom.setAttribute(element, 'id', item.id);
        DrxDom.setAttribute(element, 'name', item.name);
        for (const [name, value] of Object.entries(item.attributes)) DrxDom.setAttribute(element, name, value);
        return element;
    },
    mount(container: Node, item: DrxIcon, context: RenderContext): void {
        const host = document.createElement(NodeType.Icon);
        host.style.display = 'contents';
        container.appendChild(host);
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        ExpressionParser.bindAttributes(svg, item.attributes, context.locals);
        ExpressionParser.bind(item.name, context.locals, name => IconSheet.apply(svg, name));
        host.appendChild(svg);
        Signal.cleanup(() => host.remove());
    },
    preview(container: Node, id: string, context: PreviewContext): Node {
        const host = document.createElement(NodeType.Icon);
        host.style.display = 'contents';
        container.appendChild(host);
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        host.appendChild(svg);
        Signal.effect(() => {
            const name = context.root.proxy.icons[id].name();
            const attributes = context.root.proxy.icons[id].attributes();
            ExpressionParser.applyPreviewAttributes(svg, attributes, context);
            IconSheet.apply(svg, ExpressionParser.isLiteral(name) ? name : undefined);
        });
        Signal.cleanup(() => host.remove());
        return host;
    }
};
