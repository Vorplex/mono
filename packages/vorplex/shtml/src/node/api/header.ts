import { $Id } from '@vorplex/core';
import { ShtmlDocumentState } from '../../shtml';
import { ShtmlDom } from '../../shtml-dom';
import { NodeType } from '../node-type';

export interface ShtmlApiHeader {
    id: string;
    name: string;
    required: boolean;
    description?: string;
}

export const ShtmlApiHeader = {
    from(parent: Element, state: ShtmlDocumentState): ShtmlApiHeader[] {
        const elements = Array.from(parent.querySelectorAll(`:scope > ${NodeType.ApiHeader}`));
        return elements.map(element => ShtmlApiHeader.parse(element, state));
    },
    parse(element: Element, state: ShtmlDocumentState): ShtmlApiHeader {
        const header: ShtmlApiHeader = {
            id: ShtmlDom.getAttribute(element, 'id') ?? $Id.guid(),
            name: ShtmlDom.getRequiredAttribute(element, 'name'),
            required: ShtmlDom.getBooleanAttribute(element, 'required'),
            description: ShtmlDom.getAttribute(element, 'description')
        };
        state.apiHeaders[header.id] = header;
        return header;
    },
    to(header: ShtmlApiHeader): Element {
        const element = document.createElement(NodeType.ApiHeader);
        element.setAttribute('id', header.id);
        element.setAttribute('name', header.name);
        element.setAttribute('required', String(header.required));
        if (header.description) element.setAttribute('description', header.description);
        return element;
    }
};
