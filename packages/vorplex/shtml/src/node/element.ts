import { $Id, Signal } from '@vorplex/core';
import { BindingParser } from '../binding-parser';
import { PreviewContext } from '../preview-context';
import { RenderContext } from '../render-context';
import { ShtmlDocumentState } from '../shtml';
import { NON_TEMPLATE_TAGS, NodeType } from './node-type';
import { ShtmlTemplate, ShtmlTemplateItem } from './template-item';

export interface ShtmlElement {
    id: string;
    type: NodeType.Element;
    tag: string;
    attributes: Record<string, string>;
    template: ShtmlTemplateItem[];
}

export const ShtmlElement = {
    from(parent: Element, state: ShtmlDocumentState): ShtmlTemplateItem[] {
        const elements = Array.from(parent.children)
            .filter(child => !NON_TEMPLATE_TAGS.has(child.tagName) && child.tagName !== NodeType.If && child.tagName !== NodeType.For);
        return elements.map(element => ShtmlElement.parse(element, state));
    },
    parse(element: Element, state: ShtmlDocumentState): ShtmlTemplateItem {
        const item: ShtmlElement = {
            id: $Id.guid(),
            type: NodeType.Element,
            tag: element.tagName.toLowerCase(),
            attributes: element.getAttributeNames().reduce((attributes, name) => Object.assign(attributes, { [name]: element.getAttribute(name) }), {}),
            template: ShtmlTemplate.from(element, state)
        };
        state.elements[item.id] = item;
        return { id: item.id, type: item.type };
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
    }
};
