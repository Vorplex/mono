import { $Id } from '@vorplex/core';
import { ShtmlDocumentState } from '../../shtml';
import { ShtmlDom } from '../../shtml-dom';
import { NodeType } from '../node-type';

export interface ShtmlApiResponse {
    id: string;
    type: string;
}

export const ShtmlApiResponse = {
    from(parent: Element, state: ShtmlDocumentState): ShtmlApiResponse | undefined {
        const element = ShtmlDom.getNode(parent, NodeType.ApiResponse);
        return element ? ShtmlApiResponse.parse(element, state) : undefined;
    },
    parse(element: Element, state: ShtmlDocumentState): ShtmlApiResponse {
        const response: ShtmlApiResponse = {
            id: ShtmlDom.getAttribute(element, 'id') ?? $Id.guid(),
            type: ShtmlDom.getAttribute(element, 'type') ?? 'any'
        };
        state.apiResponses[response.id] = response;
        return response;
    },
    to(response: ShtmlApiResponse): Element {
        const element = document.createElement(NodeType.ApiResponse);
        element.setAttribute('id', response.id);
        element.setAttribute('type', response.type);
        return element;
    }
};
