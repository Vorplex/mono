import { DrxDom } from '../dom';
import type { DrxDocumentState } from '../document';
import { NodeType } from './node-type';
import { DrxTemplateItem } from './template-item';

export interface DrxPageContainer {
    id: string;
    type: NodeType.PageContainer;
    page: string;
}

export const DrxPageContainer = class {

    public static parse(element: Element, state: DrxDocumentState): DrxTemplateItem {
        const item: DrxPageContainer = {
            id: DrxDom.getId(element),
            type: NodeType.PageContainer,
            page: DrxDom.getRequiredAttribute(element, 'page')
        };
        state.pageContainers[item.id] = item;
        return { id: item.id, type: item.type };
    }

    public static to(item: DrxPageContainer): Element {
        const element = document.createElement(NodeType.PageContainer);
        DrxDom.setAttribute(element, 'id', item.id);
        DrxDom.setAttribute(element, 'page', item.page);
        return element;
    }

}
