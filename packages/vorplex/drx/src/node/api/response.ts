import { TsonDefinition } from '@vorplex/core';
import { DrxDom } from '../../dom';
import type { DrxDocumentState } from '../../document';
import { NodeType } from '../node-type';

export interface DrxApiResponse {
    id: string;
    definition: TsonDefinition;
}

export const DrxApiResponse = class {

    public static parse(element: Element, state: DrxDocumentState): DrxApiResponse {
        const response: DrxApiResponse = {
            id: DrxDom.getId(element),
            definition: DrxDom.getJsonContent(element) ?? { type: 'any' }
        };
        state.apiResponses[response.id] = response;
        return response;
    }

    public static to(response: DrxApiResponse): Element {
        const element = document.createElement(NodeType.ApiResponse);
        DrxDom.setAttribute(element, 'id', response.id);
        DrxDom.setJsonContent(element, response.definition);
        return element;
    }

}
