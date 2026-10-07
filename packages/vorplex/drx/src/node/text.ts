import { $Id } from '@vorplex/core';
import type { DrxDocumentState } from '../document';
import { NodeType } from './node-type';
import { DrxTemplateItem } from './template-item';

export interface DrxText {
    id: string;
    type: NodeType.Text;
    content: string;
}

export const DrxText = class {

    public static parse(node: ChildNode, state: DrxDocumentState): DrxTemplateItem {
        const text: DrxText = {
            id: $Id.guid(),
            type: NodeType.Text,
            content: node.textContent.replace(/^\s*\n\s*/, '').replace(/\s*\n\s*$/, '').replace(/\s+/g, ' ')
        };
        state.texts[text.id] = text;
        return { id: text.id, type: text.type };
    }

    public static to(text: DrxText): Text {
        return document.createTextNode(text.content);
    }

}
