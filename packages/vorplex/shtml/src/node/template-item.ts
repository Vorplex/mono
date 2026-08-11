import { Getter, Scope, Signal } from '@vorplex/core';
import { PreviewContext } from '../preview-context';
import { RenderContext } from '../render-context';
import { ShtmlDocumentState } from '../shtml';
import { ShtmlComponentInstance } from './component/instance';
import { ShtmlElement } from './element';
import { ShtmlFor } from './for';
import { ShtmlIcon } from './icon';
import { ShtmlIf } from './if';
import { NON_TEMPLATE_TAGS, NodeType } from './node-type';
import { ShtmlPageContainer } from './page-container';
import { ShtmlText } from './text';

export interface ShtmlTemplateItem {
    id: string;
    type: NodeType;
}

export const ShtmlTemplate = {
    from(parent: Element, state: ShtmlDocumentState): ShtmlTemplateItem[] {
        const items: ShtmlTemplateItem[] = [];
        for (const node of Array.from(parent.childNodes)) {
            if (node.nodeType === Node.TEXT_NODE) {
                // Pretty-printed source puts a newline + indentation between every tag -- that's a
                // whitespace-only text node carrying no authored content, not a real <x-text>. A same-line
                // space (e.g. "<b>Hello</b> <b>world</b>") has no newline and is kept, since it's meaningful.
                const content = node.textContent ?? '';
                if (/^\s*$/.test(content) && content.includes('\n')) continue;
                items.push(ShtmlText.parse(node, state));
                continue;
            }
            if (node.nodeType !== Node.ELEMENT_NODE) continue;
            const child = node as Element;
            if (NON_TEMPLATE_TAGS.has(child.tagName)) continue;
            if (child.tagName === NodeType.If) {
                items.push(ShtmlIf.parse(child, state));
            } else if (child.tagName === NodeType.For) {
                items.push(ShtmlFor.parse(child, state));
            } else if (child.tagName === NodeType.ComponentInstance) {
                items.push(ShtmlComponentInstance.parse(child, state));
            } else if (child.tagName === NodeType.PageContainer) {
                items.push(ShtmlPageContainer.parse(child, state));
            } else if (child.tagName === NodeType.Icon) {
                items.push(ShtmlIcon.parse(child, state));
            } else {
                items.push(ShtmlElement.parse(child, state));
            }
        }
        return items;
    },
    to(items: ShtmlTemplateItem[], state: ShtmlDocumentState): Node[] {
        return items.map(item => {
            if (item.type === NodeType.Text) return ShtmlText.to(state.texts[item.id]);
            if (item.type === NodeType.If) return ShtmlIf.to(state.ifs[item.id], state);
            if (item.type === NodeType.For) return ShtmlFor.to(state.fors[item.id], state);
            if (item.type === NodeType.ComponentInstance) return ShtmlComponentInstance.to(state.componentInstances[item.id]);
            if (item.type === NodeType.PageContainer) return ShtmlPageContainer.to(state.pageContainers[item.id]);
            if (item.type === NodeType.Icon) return ShtmlIcon.to(state.icons[item.id]);
            return ShtmlElement.to(state.elements[item.id], state);
        });
    },
    mount(container: Node, items: ShtmlTemplateItem[], context: RenderContext): Scope {
        return Signal.scope(() => {
            const state = context.state;
            for (const item of items) {
                if (item.type === NodeType.Text) ShtmlText.mount(container, state.texts[item.id], context);
                else if (item.type === NodeType.If) ShtmlIf.mount(container, state.ifs[item.id], context);
                else if (item.type === NodeType.For) ShtmlFor.mount(container, state.fors[item.id], context);
                else if (item.type === NodeType.ComponentInstance) ShtmlComponentInstance.mount(container, state.componentInstances[item.id], context);
                else if (item.type === NodeType.PageContainer) ShtmlPageContainer.mount(container, state.pageContainers[item.id], context);
                else if (item.type === NodeType.Icon) ShtmlIcon.mount(container, state.icons[item.id], context);
                else ShtmlElement.mount(container, state.elements[item.id], context);
            }
        });
    },
    preview(container: Node, items: Getter<ShtmlTemplateItem[]>, context: PreviewContext): void {
        const entries = Signal.keyed(
            items,
            entry => entry.value.id,
            entry => {
                const { id, type } = entry().value;
                if (type === NodeType.Text) return ShtmlText.preview(container, id, context);
                if (type === NodeType.If) return ShtmlIf.preview(container, id, context);
                if (type === NodeType.For) return ShtmlFor.preview(container, id, context);
                if (type === NodeType.ComponentInstance) return ShtmlComponentInstance.preview(container, id, context);
                if (type === NodeType.PageContainer) return ShtmlPageContainer.preview(container, id, context);
                if (type === NodeType.Icon) return ShtmlIcon.preview(container, id, context);
                return ShtmlElement.preview(container, id, context);
            }
        );
        Signal.effect(() => {
            for (const entry of entries()) container.appendChild(entry);
        });
    }
};
