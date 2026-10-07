import { DrxDom } from '../../dom';
import type { DrxDocumentState } from '../../document';
import { NodeType } from '../node-type';

export interface DrxApiHeader {
    id: string;
    name: string;
    required: boolean;
    description?: string;
}

export const DrxApiHeader = class {

    public static parse(element: Element, state: DrxDocumentState): DrxApiHeader {
        const header: DrxApiHeader = {
            id: DrxDom.getId(element),
            name: DrxDom.getRequiredAttribute(element, 'name'),
            required: DrxDom.getBooleanAttribute(element, 'required'),
            description: DrxDom.getAttribute(element, 'description')
        };
        state.apiHeaders[header.id] = header;
        return header;
    }

    public static to(header: DrxApiHeader): Element {
        const element = document.createElement(NodeType.ApiHeader);
        DrxDom.setAttribute(element, 'id', header.id);
        DrxDom.setAttribute(element, 'name', header.name);
        DrxDom.setAttribute(element, 'required', String(header.required));
        if (header.description) DrxDom.setAttribute(element, 'description', header.description);
        return element;
    }

}
