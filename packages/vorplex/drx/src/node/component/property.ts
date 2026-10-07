import { DrxDom } from '../../dom';
import type { DrxDocumentState } from '../../document';
import { NodeType } from '../node-type';

export interface DrxComponentProperty {
    id: string;
    name: string;
    type: string;
}

export const DrxComponentProperty = class {

    public static parse(element: Element, state: DrxDocumentState): DrxComponentProperty {
        const property: DrxComponentProperty = {
            id: DrxDom.getId(element),
            name: DrxDom.getRequiredAttribute(element, 'name'),
            type: DrxDom.getAttribute(element, 'type') ?? 'any'
        };
        state.componentProperties[property.id] = property;
        return property;
    }

    public static to(property: DrxComponentProperty): Element {
        const element = document.createElement(NodeType.ComponentProperty);
        DrxDom.setAttribute(element, 'id', property.id);
        DrxDom.setAttribute(element, 'name', property.name);
        DrxDom.setAttribute(element, 'type', property.type);
        return element;
    }

}
