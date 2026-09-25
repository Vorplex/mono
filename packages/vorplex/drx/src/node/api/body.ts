import { $Id, TsonDefinition } from '@vorplex/core';
import { DrxDocumentState } from '../../drx';
import { DrxDom } from '../../drx-dom';
import { NodeType } from '../node-type';

export interface DrxApiBody {
    id: string;
    definition: TsonDefinition;
}

export const DrxApiBody = {
    from(parent: Element, state: DrxDocumentState): DrxApiBody | undefined {
        const element = DrxDom.getNode(parent, NodeType.ApiBody);
        return element ? DrxApiBody.parse(element, state) : undefined;
    },
    parse(element: Element, state: DrxDocumentState): DrxApiBody {
        const body: DrxApiBody = {
            id: DrxDom.getAttribute(element, 'id') ?? $Id.guid(),
            definition: DrxDom.getJsonContent(element) ?? { type: 'any' }
        };
        state.apiBodies[body.id] = body;
        return body;
    },
    to(body: DrxApiBody): Element {
        const element = document.createElement(NodeType.ApiBody);
        DrxDom.setAttribute(element, 'id', body.id);
        DrxDom.setJsonContent(element, body.definition);
        return element;
    }
};
