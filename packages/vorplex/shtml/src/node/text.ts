import { $Id, Signal } from '@vorplex/core';
import { BindingParser } from '../binding-parser';
import { ExpressionDisplay } from '../expression-display';
import { PreviewContext } from '../preview-context';
import { RenderContext } from '../render-context';
import { ShtmlDocumentState } from '../shtml';
import { NodeType } from './node-type';
import { ShtmlTemplateItem } from './template-item';

export interface ShtmlText {
    id: string;
    type: NodeType.Text;
    content: string;
}

export const ShtmlText = {
    from(parent: Element, state: ShtmlDocumentState): ShtmlTemplateItem[] {
        return Array.from(parent.childNodes)
            .filter(node => node.nodeType === Node.TEXT_NODE)
            .map(node => ShtmlText.parse(node, state));
    },
    parse(node: ChildNode, state: ShtmlDocumentState): ShtmlTemplateItem {
        const text: ShtmlText = {
            id: $Id.guid(),
            type: NodeType.Text,
            content: node.textContent ?? ''
        };
        state.texts[text.id] = text;
        return { id: text.id, type: text.type };
    },
    to(text: ShtmlText): Text {
        return document.createTextNode(text.content);
    },
    mount(container: Node, item: ShtmlText, context: RenderContext): void {
        const node = document.createTextNode('');
        container.appendChild(node);
        BindingParser.bind(item.content, context.locals, value => {
            node.textContent = value == null ? '' : String(value);
        });
        Signal.cleanup(() => node.remove());
    },
    // No evaluation: any {{ }} expression is masked down to its own abbreviated source (ExpressionDisplay)
    // rather than run, so a text node's rendered content is always illustrative, never a real value.
    preview(container: Node, id: string, context: PreviewContext): Node {
        const node = document.createTextNode('');
        container.appendChild(node);
        Signal.effect(() => {
            const content = context.root.proxy.texts[id].content();
            node.textContent = ExpressionDisplay.mask(content);
        });
        Signal.cleanup(() => node.remove());
        return node;
    }
};
