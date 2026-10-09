import { $Id } from '@vorplex/core';
import type { DrxDocumentState } from '../document';
import { NodeType } from './node-type';
import { DrxTemplateItem } from './template-item';

export interface DrxText {
    id: string;
    type: NodeType.Text;
    content: string;
}

class DrxTextClass {

    public static parse(node: ChildNode, state: DrxDocumentState): DrxTemplateItem {
        const text: DrxText = {
            id: DrxText.getId(node),
            type: NodeType.Text,
            content: node.textContent.replace(/^\s*\n\s*/, '').replace(/\s*\n\s*$/, '').replace(/\s+/g, ' ')
        };
        state.texts[text.id] = text;
        return { id: text.id, type: text.type };
    }

    public static isSignificant(node: ChildNode): boolean {
        const content = node.textContent ?? '';
        return !(/^\s*$/.test(content) && content.includes('\n'));
    }

    private static getId(node: ChildNode): string {
        const textIndex = Array.from(node.parentNode.childNodes).filter(sibling => sibling.nodeType === Node.TEXT_NODE && DrxText.isSignificant(sibling)).indexOf(node);
        const path: string[] = [];
        for (let element = node.parentElement; element; element = element.parentElement) {
            const id = element.getAttribute('x-id') ?? (Object.values<string>(NodeType).includes(element.tagName) ? element.getAttribute('id') : null);
            if (id) {
                path.unshift(id);
                break;
            }
            const elementIndex = Array.from(element.parentElement?.children ?? []).filter(sibling => sibling.localName === element.localName).indexOf(element);
            path.unshift(`${element.localName}[${elementIndex}]`);
        }
        return $Id.hash(`text|${path.join('/')}|${textIndex}`);
    }

    public static to(text: DrxText): Text {
        return document.createTextNode(text.content);
    }

}

export const DrxText = DrxTextClass;