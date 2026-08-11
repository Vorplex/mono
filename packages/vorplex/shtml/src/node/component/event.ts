import { $Id } from '@vorplex/core';
import { ShtmlDocumentState } from '../../shtml';
import { ShtmlDom } from '../../shtml-dom';
import { NodeType } from '../node-type';

export interface ShtmlComponentEvent {
    id: string;
    name: string;
    definition: string;
}

export const ShtmlComponentEvent = {
    from(parent: Element, state: ShtmlDocumentState): ShtmlComponentEvent[] {
        const elements = Array.from(parent.querySelectorAll(`:scope > ${NodeType.ComponentEvent}`));
        return elements.map(element => ShtmlComponentEvent.parse(element, state));
    },
    parse(element: Element, state: ShtmlDocumentState): ShtmlComponentEvent {
        const event: ShtmlComponentEvent = {
            id: ShtmlDom.getAttribute(element, 'id') ?? $Id.guid(),
            name: ShtmlDom.getRequiredAttribute(element, 'name'),
            definition: ShtmlDom.getAttribute(element, 'type') ?? 'any'
        };
        state.events[event.id] = event;
        return event;
    },
    to(event: ShtmlComponentEvent): Element {
        const element = document.createElement(NodeType.ComponentEvent);
        element.setAttribute('id', event.id);
        element.setAttribute('name', event.name);
        element.setAttribute('type', event.definition);
        return element;
    }
};
