import { $Id, $Value, EntityAdaptor, Signal } from '@vorplex/core';
import { BindingParser } from '../binding-parser';
import { PreviewContext } from '../preview-context';
import { RenderContext } from '../render-context';
import { ShtmlDocumentState } from '../shtml';
import { NodeType } from './node-type';
import { ShtmlTemplate, ShtmlTemplateItem } from './template-item';
import { ShtmlText } from './text';

export interface ShtmlElement {
    id: string;
    type: NodeType.Element;
    tag: string;
    attributes: Record<string, string>;
    template: ShtmlTemplateItem[];
}

export const ShtmlElement = {
    parse(element: Element, state: ShtmlDocumentState): ShtmlTemplateItem {
        const item: ShtmlElement = {
            id: $Id.guid(),
            type: NodeType.Element,
            tag: element.tagName.toLowerCase(),
            attributes: element.getAttributeNames().reduce((attributes, name) => Object.assign(attributes, { [name]: element.getAttribute(name) }), {}),
            template: ShtmlTemplate.from(element, state)
        };
        state.elements[item.id] = item;
        return { id: item.id, kind: item.type };
    },
    to(item: ShtmlElement, state: ShtmlDocumentState): Element {
        const element = document.createElement(item.tag);
        for (const [name, value] of Object.entries(item.attributes)) element.setAttribute(name, value);
        for (const child of ShtmlTemplate.to(item.template, state)) element.appendChild(child);
        return element;
    },
    mount(container: Node, item: ShtmlElement, context: RenderContext): void {
        const element = document.createElement(item.tag);
        BindingParser.bindAttributes(element, item.attributes, context.locals);
        container.appendChild(element);
        ShtmlTemplate.mount(element, item.template, context);
        Signal.cleanup(() => element.remove());
    },
    preview(container: Node, id: string, context: PreviewContext): Node {
        const item = context.root.value.elements[id];
        const element = document.createElement(item.tag);
        container.appendChild(element);
        Signal.effect(() => {
            const attributes = context.root.proxy.elements[id].attributes();
            BindingParser.applyPreviewAttributes(element, { ...attributes, 'data-shtml-id': id }, context);
        });
        ShtmlTemplate.preview(element, () => context.root.proxy.elements[id].template(), context);
        Signal.cleanup(() => element.remove());
        return element;
    },
    getText(element: ShtmlElement, state: ShtmlDocumentState): string | undefined {
        if (element.template.length === 0) return '';
        const [only] = element.template;
        if (element.template.length === 1 && only.kind === NodeType.Text) return state.texts[only.id].content;
        return undefined;
    },
    setText(element: ShtmlElement, state: ShtmlDocumentState, value: string): ShtmlDocumentState {
        const [only] = element.template;
        if (element.template.length === 1 && only.kind === NodeType.Text) {
            return $Value.set(state, s => s.texts[only.id].content, value);
        }
        const text: ShtmlText = { id: $Id.guid(), type: NodeType.Text, content: value };
        const withText = { ...state, texts: EntityAdaptor.create(state.texts, text) };
        return $Value.set(withText, s => s.elements[element.id].template, [{ id: text.id, kind: NodeType.Text }]);
    }
};
