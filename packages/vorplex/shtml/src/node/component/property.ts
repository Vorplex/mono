import { $Id } from '@vorplex/core';
import { ShtmlDocumentState } from '../../shtml';
import { ShtmlDom } from '../../shtml-dom';
import { NodeType } from '../node-type';

export interface ShtmlComponentProperty {
    id: string;
    name: string;
    type: string;
}

export const ShtmlComponentProperty = {
    from(parent: Element, state: ShtmlDocumentState): ShtmlComponentProperty[] {
        const elements = Array.from(parent.querySelectorAll(`:scope > ${NodeType.ComponentProperty}`));
        return elements.map(element => ShtmlComponentProperty.parse(element, state));
    },
    parse(element: Element, state: ShtmlDocumentState): ShtmlComponentProperty {
        const property: ShtmlComponentProperty = {
            id: ShtmlDom.getAttribute(element, 'id') ?? $Id.guid(),
            name: ShtmlDom.getRequiredAttribute(element, 'name'),
            type: ShtmlDom.getAttribute(element, 'type') ?? 'any'
        };
        state.componentProperties[property.id] = property;
        return property;
    },
    to(property: ShtmlComponentProperty): Element {
        const element = document.createElement(NodeType.ComponentProperty);
        element.setAttribute('id', property.id);
        element.setAttribute('name', property.name);
        element.setAttribute('type', property.type);
        return element;
    }
};
