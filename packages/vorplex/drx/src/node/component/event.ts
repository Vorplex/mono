import { DrxDom } from '../../dom';
import type { DrxDocumentState } from '../../document';
import { NodeType } from '../node-type';

export interface DrxComponentEvent {
    id: string;
    name: string;
    type: string;
}

export const DrxComponentEvent = class {

    public static parse(element: Element, state: DrxDocumentState): DrxComponentEvent {
        const event: DrxComponentEvent = {
            id: DrxDom.getId(element),
            name: DrxDom.getRequiredAttribute(element, 'name'),
            type: DrxDom.getAttribute(element, 'type') ?? 'any'
        };
        state.componentEvents[event.id] = event;
        return event;
    }

    public static to(event: DrxComponentEvent): Element {
        const element = document.createElement(NodeType.ComponentEvent);
        DrxDom.setAttribute(element, 'id', event.id);
        DrxDom.setAttribute(element, 'name', event.name);
        DrxDom.setAttribute(element, 'type', event.type);
        return element;
    }

}
