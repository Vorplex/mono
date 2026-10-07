import type { DrxDocumentState } from '../document';
import { DrxComponentInstance } from './component/instance';
import { DrxElement } from './element';
import { DrxFor } from './for';
import { DrxIcon } from './icon';
import { DrxIf } from './if/if';
import { NodeType } from './node-type';
import { DrxPageContainer } from './page-container';
import { DrxRouterRoute } from './router/router-route';
import { DrxText } from './text';

export interface DrxTemplateItem {
    id: string;
    type: NodeType;
}

export type DrxTemplateNode = DrxElement | DrxIf | DrxFor | DrxComponentInstance | DrxPageContainer | DrxIcon | DrxText | DrxRouterRoute;

export type DrxTemplateTargetType = NodeType.App | NodeType.Page | NodeType.Component | NodeType.Element | NodeType.If | NodeType.ElseIf | NodeType.Else | NodeType.For | NodeType.RouterRoute;

export const DrxTemplate = class {

    public static parse(parent: Element, state: DrxDocumentState): DrxTemplateItem[] {
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
                NodeType.PwaMetadata,
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
    }

    public static to(items: DrxTemplateItem[], state: DrxDocumentState): Node[] {
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
    }

}
