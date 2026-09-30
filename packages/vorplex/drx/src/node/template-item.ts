import { Getter, Scope, Signal } from '@vorplex/core';
import { $Element } from '@vorplex/web';
import { DrxDocumentState } from '../drx';
import { PreviewContext } from '../preview-context';
import { RenderContext } from '../render-context';
import { DrxComponentInstance } from './component/instance';
import { DrxElement } from './element';
import { DrxFor } from './for';
import { DrxIcon } from './icon';
import { DrxElse } from './if/else';
import { DrxElseIf } from './if/else-if';
import { DrxIf } from './if/if';
import { NodeType } from './node-type';
import { DrxPage } from './page';
import { DrxPageContainer } from './page-container';
import { DrxRouterRoute } from './router/router-route';
import { DrxText } from './text';

export interface DrxTemplateItem {
    id: string;
    type: NodeType;
}

export type DrxTemplateNode = DrxElement | DrxIf | DrxFor | DrxComponentInstance | DrxPageContainer | DrxIcon | DrxText | DrxRouterRoute;

export type DrxTemplateTargetType = NodeType.App | NodeType.Page | NodeType.Component | NodeType.Element | NodeType.If | NodeType.ElseIf | NodeType.Else | NodeType.For | NodeType.RouterRoute;

export const DrxTemplate = {
    from(parent: Element, state: DrxDocumentState): DrxTemplateItem[] {
        const items: DrxTemplateItem[] = [];
        for (const node of Array.from(parent.childNodes)) {
            if (node.nodeType === Node.TEXT_NODE) {
                if (/^\s*$/.test(node.textContent ?? '') && node.textContent.includes('\n')) continue;
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
                NodeType.Type,
                NodeType.Service,
                NodeType.Asset,
                NodeType.Component,
                NodeType.ComponentProperty,
                NodeType.ComponentEvent,
                NodeType.Api,
                NodeType.ElseIf,
                NodeType.Else,
                'SCRIPT',
                'STYLE',
            ];
            const tagName = child.tagName.toUpperCase();
            if (noneTemplateTags.includes(tagName)) continue;
            if (tagName === NodeType.If) {
                items.push(DrxIf.parse(child, state));
            } else if (tagName === NodeType.For) {
                items.push(DrxFor.parse(child, state));
            } else if (tagName === NodeType.ComponentInstance) {
                items.push(DrxComponentInstance.parse(child, state));
            } else if (tagName === NodeType.PageContainer) {
                items.push(DrxPageContainer.parse(child, state));
            } else if (tagName === NodeType.Icon) {
                items.push(DrxIcon.parse(child, state));
            } else if (tagName === NodeType.RouterRoute) {
                items.push(DrxRouterRoute.parse(child, state));
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
            if (item.type === NodeType.RouterRoute) return DrxRouterRoute.to(state.routerRoutes[item.id], state);
            return DrxElement.to(state.elements[item.id], state);
        });
    },
    mount(container: Node, items: DrxTemplateItem[], context: RenderContext): Scope {
        return Signal.scope(() => {
            for (const item of items) {
                try {
                    Signal.scope(() => {
                        const state = context.state;
                        if (item.type === NodeType.Text) DrxText.mount(container, state.texts[item.id], context);
                        else if (item.type === NodeType.If) DrxIf.mount(container, state.ifs[item.id], context);
                        else if (item.type === NodeType.For) DrxFor.mount(container, state.fors[item.id], context);
                        else if (item.type === NodeType.ComponentInstance) DrxComponentInstance.mount(container, state.componentInstances[item.id], context);
                        else if (item.type === NodeType.PageContainer) DrxPageContainer.mount(container, state.pageContainers[item.id], context);
                        else if (item.type === NodeType.Icon) DrxIcon.mount(container, state.icons[item.id], context);
                        else if (item.type === NodeType.RouterRoute) DrxRouterRoute.mount(container, state.routerRoutes[item.id], context);
                        else DrxElement.mount(container, state.elements[item.id], context);
                    });
                } catch (error) {
                    const node = item.type === NodeType.Element ? context.state.elements[item.id].tag : item.type === NodeType.Text ? 'text()' : item.type.toLowerCase();
                    const owner = context.nearest.component ? `component "${context.nearest.component.component.name}"` : context.nearest.page ? `page "${context.nearest.page.page.name}"` : 'app';
                    console.error(`Failed to render node at path "${$Element.getXPath(container as Element).replace(/\/$/, '')}/${node}" in ${owner}.`, error);
                }
            }
        });
    },
    preview(container: Node, items: Getter<DrxTemplateItem[]>, context: PreviewContext): void {
        const entries = Signal.keyed(
            () => items() ?? [],
            entry => entry.value.id,
            entry => DrxTemplate.previewItem(container, entry().value, context)
        );
        Signal.effect(() => {
            for (const entry of entries()) container.appendChild(entry);
        });
    },
    previewItem(container: Node, item: DrxTemplateItem, context: PreviewContext): Node {
        const renderDefault = (target: Node): Node => {
            if (item.type === NodeType.Text) return DrxText.preview(target, item.id, context);
            if (item.type === NodeType.If) return DrxIf.preview(target, item.id, context);
            if (item.type === NodeType.ElseIf) return DrxElseIf.preview(target, item.id, context);
            if (item.type === NodeType.Else) return DrxElse.preview(target, item.id, context);
            if (item.type === NodeType.For) return DrxFor.preview(target, item.id, context);
            if (item.type === NodeType.ComponentInstance) return DrxComponentInstance.preview(target, item.id, context);
            if (item.type === NodeType.PageContainer) return DrxPageContainer.preview(target, item.id, context);
            if (item.type === NodeType.Icon) return DrxIcon.preview(target, item.id, context);
            if (item.type === NodeType.RouterRoute) return DrxRouterRoute.preview(target, item.id, context);
            if (item.type === NodeType.Page) return DrxPage.preview(target, item.id, context);
            return DrxElement.preview(target, item.id, context);
        };
        if (!context.render) return renderDefault(container);
        const host = document.createElement(NodeType.Element);
        host.style.display = 'contents';
        host.setAttribute('data-drx-id', item.id);
        container.appendChild(host);
        Signal.effect(() => {
            const result = context.render(item, context.root.proxy);
            if (result === null) return;
            if (result === undefined) {
                renderDefault(host);
                return;
            }
            host.appendChild(result);
            Signal.cleanup(() => result.remove());
        });
        Signal.cleanup(() => host.remove());
        return host;
    },
};
