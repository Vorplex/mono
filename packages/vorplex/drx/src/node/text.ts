import { $Id, Signal } from '@vorplex/core';
import { DrxDocumentState } from '../drx';
import { DrxExpressionDisplay } from '../expression-display';
import { DrxExpressionParser } from '../expression-parser';
import { PreviewContext } from '../preview-context';
import { RenderContext } from '../render-context';
import { NodeType } from './node-type';
import { DrxTemplateItem } from './template-item';

export interface DrxText {
    id: string;
    type: NodeType.Text;
    content: string;
}

export const DrxText = {
    from(parent: Element, state: DrxDocumentState): DrxTemplateItem[] {
        return Array.from(parent.childNodes)
            .filter(node => node.nodeType === Node.TEXT_NODE)
            .map(node => DrxText.parse(node, state));
    },
    parse(node: ChildNode, state: DrxDocumentState): DrxTemplateItem {
        const text: DrxText = {
            id: $Id.guid(),
            type: NodeType.Text,
            content: node.textContent.replace(/\s+/g, ' ').trim()
        };
        state.texts[text.id] = text;
        return { id: text.id, type: text.type };
    },
    to(text: DrxText): Text {
        return document.createTextNode(text.content);
    },
    mount(container: Node, item: DrxText, context: RenderContext): void {
        const node = document.createTextNode('');
        container.appendChild(node);
        DrxExpressionParser.bind(item.content, context.locals, value => {
            node.textContent = value == null ? '' : String(value);
        });
        Signal.cleanup(() => node.remove());
    },
    preview(container: Node, id: string, context: PreviewContext): Node {
        const node = document.createTextNode('');
        container.appendChild(node);
        Signal.effect(() => {
            const content = context.root.proxy.texts[id].content();
            node.textContent = DrxExpressionDisplay.mask(content);
        });
        Signal.cleanup(() => node.remove());
        return node;
    }
};
