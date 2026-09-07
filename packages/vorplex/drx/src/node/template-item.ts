import { Getter, Scope, Signal } from '@vorplex/core';
import { PreviewContext } from '../preview-context';
import { RenderContext } from '../render-context';
import { DrxDocumentState } from '../drx';
import { DrxComponentInstance } from './component/instance';
import { DrxElement } from './element';
import { DrxFor } from './for';
import { DrxIcon } from './icon';
import { DrxIf } from './if';
import { NodeType } from './node-type';
import { DrxPageContainer } from './page-container';
import { DrxText } from './text';

export interface DrxTemplateItem {
    id: string;
    type: NodeType;
}

export type DrxTemplateNode = DrxElement | DrxIf | DrxFor | DrxComponentInstance | DrxPageContainer | DrxIcon | DrxText;

export type DrxTemplateTargetType = NodeType.Page | NodeType.Component | NodeType.Element | NodeType.If | NodeType.For;

export const DrxTemplate = {
    from(parent: Element, state: DrxDocumentState): DrxTemplateItem[] {
        const items: DrxTemplateItem[] = [];
        for (const node of Array.from(parent.childNodes)) {
            if (node.nodeType === Node.TEXT_NODE) {
                const content = node.textContent ?? '';
                if (/^\s*$/.test(content) && content.includes('\n')) continue;
                items.push(DrxText.parse(node, state));
                continue;
            }
            if (node.nodeType !== Node.ELEMENT_NODE) continue;
            const child = node as Element;
            const noneTemplateTags = [
                NodeType.App,
                NodeType.Page,
                NodeType.Packages,
                NodeType.DependencyTree,
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
                items.push(DrxIf.parse(child, state));
            } else if (child.tagName === NodeType.For) {
                items.push(DrxFor.parse(child, state));
            } else if (child.tagName === NodeType.ComponentInstance) {
                items.push(DrxComponentInstance.parse(child, state));
            } else if (child.tagName === NodeType.PageContainer) {
                items.push(DrxPageContainer.parse(child, state));
            } else if (child.tagName === NodeType.Icon) {
                items.push(DrxIcon.parse(child, state));
            } else {
                items.push(DrxElement.parse(child, state));
            }
        }
        return items;
    },
    to(items: DrxTemplateItem[], state: DrxDocumentState): Node[] {
        return items.map(item => {
            if (item.type === NodeType.Text) return DrxText.to(state.texts[item.id]);
            if (item.type === NodeType.If) return DrxIf.to(state.ifs[item.id], state);
            if (item.type === NodeType.For) return DrxFor.to(state.fors[item.id], state);
            if (item.type === NodeType.ComponentInstance) return DrxComponentInstance.to(state.componentInstances[item.id]);
            if (item.type === NodeType.PageContainer) return DrxPageContainer.to(state.pageContainers[item.id]);
            if (item.type === NodeType.Icon) return DrxIcon.to(state.icons[item.id]);
            return DrxElement.to(state.elements[item.id], state);
        });
    },
    mount(container: Node, items: DrxTemplateItem[], context: RenderContext): Scope {
        return Signal.scope(() => {
            const state = context.state;
            for (const item of items) {
                if (item.type === NodeType.Text) DrxText.mount(container, state.texts[item.id], context);
                else if (item.type === NodeType.If) DrxIf.mount(container, state.ifs[item.id], context);
                else if (item.type === NodeType.For) DrxFor.mount(container, state.fors[item.id], context);
                else if (item.type === NodeType.ComponentInstance) DrxComponentInstance.mount(container, state.componentInstances[item.id], context);
                else if (item.type === NodeType.PageContainer) DrxPageContainer.mount(container, state.pageContainers[item.id], context);
                else if (item.type === NodeType.Icon) DrxIcon.mount(container, state.icons[item.id], context);
                else DrxElement.mount(container, state.elements[item.id], context);
            }
        });
    },
    preview(container: Node, items: Getter<DrxTemplateItem[]>, context: PreviewContext): void {
        const entries = Signal.keyed(
            items,
            entry => entry.value.id,
            entry => {
                const { id, type } = entry().value;
                if (type === NodeType.Text) return DrxText.preview(container, id, context);
                if (type === NodeType.If) return DrxIf.preview(container, id, context);
                if (type === NodeType.For) return DrxFor.preview(container, id, context);
                if (type === NodeType.ComponentInstance) return DrxComponentInstance.preview(container, id, context);
                if (type === NodeType.PageContainer) return DrxPageContainer.preview(container, id, context);
                if (type === NodeType.Icon) return DrxIcon.preview(container, id, context);
                return DrxElement.preview(container, id, context);
            }
        );
        Signal.effect(() => {
            for (const entry of entries()) container.appendChild(entry);
        });
    }
};
