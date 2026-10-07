import { $Id, $Value, EntityAdaptor } from '@vorplex/core';
import { DrxDom } from '../dom';
import type { DrxDocumentState } from '../document';
import { NodeType } from './node-type';
import { DrxTemplate, DrxTemplateItem } from './template-item';
import { DrxText } from './text';

export interface DrxElement {
    id: string;
    type: NodeType.Element;
    tag: string;
    attributes: Record<string, string>;
    template: DrxTemplateItem[];
}

export const DrxElement = class {

    public static parse(element: Element, state: DrxDocumentState): DrxTemplateItem {
        const item: DrxElement = {
            id: DrxDom.getAttribute(element, 'x-id') ?? $Id.guid(),
            type: NodeType.Element,
            tag: element.localName,
            attributes: DrxDom.getAttributes(element, 'x-id'),
            template: DrxTemplate.parse(element, state)
        };
        state.elements[item.id] = item;
        return { id: item.id, type: item.type };
    }

    public static to(item: DrxElement, state: DrxDocumentState): Element {
        const element = document.createElement(item.tag);
        DrxDom.setAttribute(element, 'x-id', item.id);
        for (const [name, value] of Object.entries(item.attributes)) DrxDom.setAttribute(element, name, value);
        for (const child of DrxTemplate.to(item.template, state)) element.appendChild(child);
        return element;
    }

    public static getText(element: DrxElement, state: DrxDocumentState): string | undefined {
        if (element.template.length === 0) return '';
        const [only] = element.template;
        if (element.template.length === 1 && only.type === NodeType.Text) return state.texts[only.id].content;
        return undefined;
    }

    public static setText(element: DrxElement, state: DrxDocumentState, value: string): DrxDocumentState {
        const [only] = element.template;
        if (element.template.length === 1 && only.type === NodeType.Text) {
            return $Value.set(state, s => s.texts[only.id].content, value);
        }
        const text: DrxText = { id: $Id.guid(), type: NodeType.Text, content: value };
        const withText = { ...state, texts: EntityAdaptor.create(state.texts, text) };
        return $Value.set(withText, s => s.elements[element.id].template, [{ id: text.id, type: NodeType.Text }]);
    }

    public static children(item: DrxElement): DrxTemplateItem[] {
        return item.template;
    }

}
