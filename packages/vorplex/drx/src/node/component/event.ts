import { $Id } from '@vorplex/core';
import { DrxDocumentState } from '../../drx';
import { DrxDom } from '../../drx-dom';
import { NodeType } from '../node-type';

export interface DrxComponentEvent {
    id: string;
    name: string;
    type: string;
}

export const DrxComponentEvent = {
    from(parent: Element, state: DrxDocumentState): DrxComponentEvent[] {
        const elements = Array.from(parent.querySelectorAll(`:scope > ${NodeType.ComponentEvent}`));
        return elements.map(element => DrxComponentEvent.parse(element, state));
    },
    parse(element: Element, state: DrxDocumentState): DrxComponentEvent {
        const event: DrxComponentEvent = {
            id: DrxDom.getAttribute(element, 'id') ?? $Id.guid(),
            name: DrxDom.getRequiredAttribute(element, 'name'),
            type: DrxDom.getAttribute(element, 'type') ?? 'any'
        };
        state.componentEvents[event.id] = event;
        return event;
    },
    to(event: DrxComponentEvent): Element {
        const element = document.createElement(NodeType.ComponentEvent);
        element.setAttribute('id', event.id);
        element.setAttribute('name', event.name);
        element.setAttribute('type', event.type);
        return element;
    }
};
