import { $Id } from '@vorplex/core';
import { DrxDocumentState } from '../../drx';
import { DrxDom } from '../../drx-dom';
import { NodeType } from '../node-type';

export interface DrxApiHeader {
    id: string;
    name: string;
    required: boolean;
    description?: string;
}

export const DrxApiHeader = {
    from(parent: Element, state: DrxDocumentState): DrxApiHeader[] {
        const elements = Array.from(parent.querySelectorAll(`:scope > ${NodeType.ApiHeader}`));
        return elements.map(element => DrxApiHeader.parse(element, state));
    },
    parse(element: Element, state: DrxDocumentState): DrxApiHeader {
        const header: DrxApiHeader = {
            id: DrxDom.getAttribute(element, 'id') ?? $Id.guid(),
            name: DrxDom.getRequiredAttribute(element, 'name'),
            required: DrxDom.getBooleanAttribute(element, 'required'),
            description: DrxDom.getAttribute(element, 'description')
        };
        state.apiHeaders[header.id] = header;
        return header;
    },
    to(header: DrxApiHeader): Element {
        const element = document.createElement(NodeType.ApiHeader);
        DrxDom.setAttribute(element, 'id', header.id);
        DrxDom.setAttribute(element, 'name', header.name);
        DrxDom.setAttribute(element, 'required', String(header.required));
        if (header.description) DrxDom.setAttribute(element, 'description', header.description);
        return element;
    }
};
