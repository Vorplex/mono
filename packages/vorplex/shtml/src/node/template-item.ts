import { Getter, Scope, Signal } from '@vorplex/core';
import { PreviewContext } from '../preview-context';
import { RenderContext } from '../render-context';
import { ShtmlDocumentState } from '../shtml';
import { ShtmlComponentInstance } from './component/instance';
import { ShtmlElement } from './element';
import { ShtmlFor } from './for';
import { ShtmlIcon } from './icon';
import { ShtmlIf } from './if';
import { NodeType } from './node-type';
import { ShtmlPageContainer } from './page-container';
import { ShtmlText } from './text';

export interface ShtmlTemplateItem {
    id: string;
    kind: NodeType;
}

export const ShtmlTemplate = {
    from(parent: Element, state: ShtmlDocumentState): ShtmlTemplateItem[] {
        const items: ShtmlTemplateItem[] = [];
        for (const node of Array.from(parent.childNodes)) {
            if (node.nodeType === Node.TEXT_NODE) {
                const content = node.textContent ?? '';
                if (/^\s*$/.test(content) && content.includes('\n')) continue;
                items.push(ShtmlText.parse(node, state));
                continue;
            }
            if (node.nodeType !== Node.ELEMENT_NODE) continue;
            const child = node as Element;
            const noneTemplateTags = [
                NodeType.App,
                NodeType.Page,
                NodeType.Packages,
                NodeType.Variable,
                NodeType.Router,
                NodeType.Type,
                NodeType.Service,
                NodeType.Asset,
                NodeType.RouterRoute,
                NodeType.Component,
                NodeType.ComponentProperty,
                NodeType.ComponentEvent,
                NodeType.Api,
                'SCRIPT',
                'STYLE'
            ];
            if (noneTemplateTags.includes(child.tagName)) continue;
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
            if (item.kind === NodeType.Text) return ShtmlText.to(state.texts[item.id]);
            if (item.kind === NodeType.If) return ShtmlIf.to(state.ifs[item.id], state);
            if (item.kind === NodeType.For) return ShtmlFor.to(state.fors[item.id], state);
            if (item.kind === NodeType.ComponentInstance) return ShtmlComponentInstance.to(state.componentInstances[item.id]);
            if (item.kind === NodeType.PageContainer) return ShtmlPageContainer.to(state.pageContainers[item.id]);
            if (item.kind === NodeType.Icon) return ShtmlIcon.to(state.icons[item.id]);
            return ShtmlElement.to(state.elements[item.id], state);
        });
    },
    mount(container: Node, items: ShtmlTemplateItem[], context: RenderContext): Scope {
        return Signal.scope(() => {
            const state = context.state;
            for (const item of items) {
                if (item.kind === NodeType.Text) ShtmlText.mount(container, state.texts[item.id], context);
                else if (item.kind === NodeType.If) ShtmlIf.mount(container, state.ifs[item.id], context);
                else if (item.kind === NodeType.For) ShtmlFor.mount(container, state.fors[item.id], context);
                else if (item.kind === NodeType.ComponentInstance) ShtmlComponentInstance.mount(container, state.componentInstances[item.id], context);
                else if (item.kind === NodeType.PageContainer) ShtmlPageContainer.mount(container, state.pageContainers[item.id], context);
                else if (item.kind === NodeType.Icon) ShtmlIcon.mount(container, state.icons[item.id], context);
                else ShtmlElement.mount(container, state.elements[item.id], context);
            }
        });
    },
    preview(container: Node, items: Getter<ShtmlTemplateItem[]>, context: PreviewContext): void {
        const entries = Signal.keyed(
            items,
            entry => entry.value.id,
            entry => {
                const { id, kind: type } = entry().value;
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
