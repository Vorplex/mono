import { $Id } from '@vorplex/core';
import { DrxDocumentState } from '../../drx';
import { DrxDom } from '../../drx-dom';
import { NodeType } from '../node-type';

export interface DrxComponentProperty {
    id: string;
    name: string;
    type: string;
}

export const DrxComponentProperty = {
    from(parent: Element, state: DrxDocumentState): DrxComponentProperty[] {
        const elements = Array.from(parent.querySelectorAll(`:scope > ${NodeType.ComponentProperty}`));
        return elements.map(element => DrxComponentProperty.parse(element, state));
    },
    parse(element: Element, state: DrxDocumentState): DrxComponentProperty {
        const property: DrxComponentProperty = {
            id: DrxDom.getAttribute(element, 'id') ?? $Id.guid(),
            name: DrxDom.getRequiredAttribute(element, 'name'),
            type: DrxDom.getAttribute(element, 'type') ?? 'any'
        };
        state.componentProperties[property.id] = property;
        return property;
    },
    to(property: DrxComponentProperty): Element {
        const element = document.createElement(NodeType.ComponentProperty);
        DrxDom.setAttribute(element, 'id', property.id);
        DrxDom.setAttribute(element, 'name', property.name);
        DrxDom.setAttribute(element, 'type', property.type);
        return element;
    }
};
