import { DrxDom } from '../../dom';
import type { DrxDocumentState } from '../../document';
import { NodeType } from '../node-type';
import { DrxTemplateItem } from '../template-item';

export interface DrxComponentInstance {
    id: string;
    type: NodeType.ComponentInstance;
    component: string;
    attributes: Record<string, string>;
}

export const DrxComponentInstance = class {

    public static parse(element: Element, state: DrxDocumentState): DrxTemplateItem {
        const item: DrxComponentInstance = {
            id: DrxDom.getId(element),
            type: NodeType.ComponentInstance,
            component: DrxDom.getRequiredAttribute(element, 'component'),
            attributes: DrxDom.getAttributes(element, 'component', 'id')
        };
        state.componentInstances[item.id] = item;
        return { id: item.id, type: item.type };
    }

    public static to(item: DrxComponentInstance): Element {
        const element = document.createElement(NodeType.ComponentInstance);
        DrxDom.setAttribute(element, 'id', item.id);
        DrxDom.setAttribute(element, 'component', item.component);
        for (const [name, value] of Object.entries(item.attributes)) DrxDom.setAttribute(element, name, value);
        return element;
    }

}
