import { $Id, TsonDefinition } from '@vorplex/core';
import { DrxDocumentState } from '../../drx';
import { DrxDom } from '../../drx-dom';
import { NodeType } from '../node-type';

export interface DrxApiResponse {
    id: string;
    definition: TsonDefinition;
}

export const DrxApiResponse = {
    from(parent: Element, state: DrxDocumentState): DrxApiResponse | undefined {
        const element = DrxDom.getNode(parent, NodeType.ApiResponse);
        return element ? DrxApiResponse.parse(element, state) : undefined;
    },
    parse(element: Element, state: DrxDocumentState): DrxApiResponse {
        const response: DrxApiResponse = {
            id: DrxDom.getAttribute(element, 'id') ?? $Id.guid(),
            definition: DrxDom.getJsonContent(element) ?? { type: 'any' }
        };
        state.apiResponses[response.id] = response;
        return response;
    },
    to(response: DrxApiResponse): Element {
        const element = document.createElement(NodeType.ApiResponse);
        DrxDom.setAttribute(element, 'id', response.id);
        DrxDom.setJsonContent(element, response.definition);
        return element;
    }
};
