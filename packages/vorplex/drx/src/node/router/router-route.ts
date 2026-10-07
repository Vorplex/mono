import { DrxDom } from '../../dom';
import type { DrxDocumentState } from '../../document';
import { NodeType } from '../node-type';
import { DrxTemplate, DrxTemplateItem } from '../template-item';

export interface DrxRouterRoute {
    id: string;
    type: NodeType.RouterRoute;
    route?: string;
    exact?: boolean;
    template: DrxTemplateItem[];
}

export const DrxRouterRoute = class {

    public static parse(element: Element, state: DrxDocumentState): DrxTemplateItem {
        const item: DrxRouterRoute = {
            id: DrxDom.getId(element),
            type: NodeType.RouterRoute,
            route: DrxDom.getAttribute(element, 'route'),
            exact: DrxDom.getBooleanAttribute(element, 'exact'),
            template: DrxTemplate.parse(element, state)
        };
        state.routerRoutes[item.id] = item;
        return {
            id: item.id,
            type: item.type
        };
    }

    public static to(item: DrxRouterRoute, state: DrxDocumentState): Element {
        const element = document.createElement(NodeType.RouterRoute);
        DrxDom.setAttribute(element, 'id', item.id);
        DrxDom.setAttribute(element, 'route', item.route);
        if (item.exact) DrxDom.setAttribute(element, 'exact', 'true');
        for (const child of DrxTemplate.to(item.template, state)) element.appendChild(child);
        return element;
    }

    public static children(item: DrxRouterRoute): DrxTemplateItem[] {
        return item.template;
    }

}
