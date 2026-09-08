import { $Id } from '@vorplex/core';
import { DrxDocumentState } from '../../drx';
import { DrxDom } from '../../drx-dom';
import { NodeType } from '../node-type';

export interface DrxApiParameter {
    id: string;
    name: string;
    required: boolean;
    description?: string;
}

export const DrxApiParameter = {
    from(parent: Element, state: DrxDocumentState): DrxApiParameter[] {
        const elements = Array.from(parent.querySelectorAll(`:scope > ${NodeType.ApiParameter}`));
        return elements.map(element => DrxApiParameter.parse(element, state));
    },
    parse(element: Element, state: DrxDocumentState): DrxApiParameter {
        const parameter: DrxApiParameter = {
            id: DrxDom.getAttribute(element, 'id') ?? $Id.guid(),
            name: DrxDom.getRequiredAttribute(element, 'name'),
            required: DrxDom.getBooleanAttribute(element, 'required'),
            description: DrxDom.getAttribute(element, 'description')
        };
        state.apiParameters[parameter.id] = parameter;
        return parameter;
    },
    to(parameter: DrxApiParameter): Element {
        const element = document.createElement(NodeType.ApiParameter);
        DrxDom.setAttribute(element, 'id', parameter.id);
        DrxDom.setAttribute(element, 'name', parameter.name);
        DrxDom.setAttribute(element, 'required', String(parameter.required));
        if (parameter.description) DrxDom.setAttribute(element, 'description', parameter.description);
        return element;
    }
};
