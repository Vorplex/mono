import { DrxDom } from '../dom';
import type { DrxDocumentState } from '../document';
import { NodeType } from './node-type';
import { DrxTemplateItem } from './template-item';

export interface DrxIcon {
    id: string;
    type: NodeType.Icon;
    name: string;
    attributes: Record<string, string>;
}

export const DrxIcon = class {

    public static parse(element: Element, state: DrxDocumentState): DrxTemplateItem {
        const item: DrxIcon = {
            id: DrxDom.getId(element),
            type: NodeType.Icon,
            name: DrxDom.getRequiredAttribute(element, 'name'),
            attributes: DrxDom.getAttributes(element, 'name', 'id')
        };
        state.icons[item.id] = item;
        return { id: item.id, type: item.type };
    }

    public static to(item: DrxIcon): Element {
        const element = document.createElement(NodeType.Icon);
        DrxDom.setAttribute(element, 'id', item.id);
        DrxDom.setAttribute(element, 'name', item.name);
        for (const [name, value] of Object.entries(item.attributes)) DrxDom.setAttribute(element, name, value);
        return element;
    }

}
