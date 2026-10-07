import { TsonDefinition } from '@vorplex/core';
import { DrxDom } from '../../dom';
import type { DrxDocumentState } from '../../document';
import { NodeType } from '../node-type';

export interface DrxApiBody {
    id: string;
    definition: TsonDefinition;
}

export const DrxApiBody = class {

    public static parse(element: Element, state: DrxDocumentState): DrxApiBody {
        const body: DrxApiBody = {
            id: DrxDom.getId(element),
            definition: DrxDom.getJsonContent(element) ?? { type: 'any' }
        };
        state.apiBodies[body.id] = body;
        return body;
    }

    public static to(body: DrxApiBody): Element {
        const element = document.createElement(NodeType.ApiBody);
        DrxDom.setAttribute(element, 'id', body.id);
        DrxDom.setJsonContent(element, body.definition);
        return element;
    }

}
