import { $Id } from '@vorplex/core';
import { ShtmlDocumentState } from '../../shtml';
import { ShtmlDom } from '../../shtml-dom';
import { NodeType } from '../node-type';

export interface ShtmlApiParameter {
    id: string;
    name: string;
    required: boolean;
}

export const ShtmlApiParameter = {
    from(parent: Element, state: ShtmlDocumentState): ShtmlApiParameter[] {
        const elements = Array.from(parent.querySelectorAll(`:scope > ${NodeType.ApiParameter}`));
        return elements.map(element => ShtmlApiParameter.parse(element, state));
    },
    parse(element: Element, state: ShtmlDocumentState): ShtmlApiParameter {
        const parameter: ShtmlApiParameter = {
            id: ShtmlDom.getAttribute(element, 'id') ?? $Id.guid(),
            name: ShtmlDom.getRequiredAttribute(element, 'name'),
            required: ShtmlDom.getBooleanAttribute(element, 'required')
        };
        state.apiParameters[parameter.id] = parameter;
        return parameter;
    },
    to(parameter: ShtmlApiParameter): Element {
        const element = document.createElement(NodeType.ApiParameter);
        element.setAttribute('id', parameter.id);
        element.setAttribute('name', parameter.name);
        element.setAttribute('required', String(parameter.required));
        return element;
    }
};
