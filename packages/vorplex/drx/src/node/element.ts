import { $Id, $Value, EntityAdaptor, Signal } from '@vorplex/core';
import { ExpressionParser } from '../expression-parser';
import { PreviewContext } from '../preview-context';
import { RenderContext } from '../render-context';
import { DrxDocumentState } from '../drx';
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

export const DrxElement = {
    parse(element: Element, state: DrxDocumentState): DrxTemplateItem {
        const item: DrxElement = {
            id: $Id.guid(),
            type: NodeType.Element,
            tag: element.tagName.toLowerCase(),
            attributes: element.getAttributeNames().reduce((attributes, name) => Object.assign(attributes, { [name]: element.getAttribute(name) }), {}),
            template: DrxTemplate.from(element, state)
        };
        state.elements[item.id] = item;
        return { id: item.id, type: item.type };
    },
    to(item: DrxElement, state: DrxDocumentState): Element {
        const element = document.createElement(item.tag);
        for (const [name, value] of Object.entries(item.attributes)) element.setAttribute(name, value);
        for (const child of DrxTemplate.to(item.template, state)) element.appendChild(child);
        return element;
    },
    mount(container: Node, item: DrxElement, context: RenderContext): void {
        const element = document.createElement(item.tag);
        ExpressionParser.bindAttributes(element, item.attributes, context.locals);
        container.appendChild(element);
        DrxTemplate.mount(element, item.template, context);
        Signal.cleanup(() => element.remove());
    },
    preview(container: Node, id: string, context: PreviewContext): Node {
        const item = context.root.value.elements[id];
        const element = document.createElement(item.tag);
        container.appendChild(element);
        Signal.effect(() => {
            const attributes = context.root.proxy.elements[id].attributes();
            ExpressionParser.applyPreviewAttributes(element, { ...attributes, 'data-drx-id': id }, context);
        });
        DrxTemplate.preview(element, () => context.root.proxy.elements[id].template(), context);
        Signal.cleanup(() => element.remove());
        return element;
    },
    getText(element: DrxElement, state: DrxDocumentState): string | undefined {
        if (element.template.length === 0) return '';
        const [only] = element.template;
        if (element.template.length === 1 && only.type === NodeType.Text) return state.texts[only.id].content;
        return undefined;
    },
    setText(element: DrxElement, state: DrxDocumentState, value: string): DrxDocumentState {
        const [only] = element.template;
        if (element.template.length === 1 && only.type === NodeType.Text) {
            return $Value.set(state, s => s.texts[only.id].content, value);
        }
        const text: DrxText = { id: $Id.guid(), type: NodeType.Text, content: value };
        const withText = { ...state, texts: EntityAdaptor.create(state.texts, text) };
        return $Value.set(withText, s => s.elements[element.id].template, [{ id: text.id, type: NodeType.Text }]);
    }
};
