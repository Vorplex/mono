import { $Id } from '@vorplex/core';
import { DrxDocumentState } from '../../drx';
import { DrxDom } from '../../drx-dom';
import { NodeType } from '../node-type';

export interface DrxApiBody {
    id: string;
    type: string;
}

export const DrxApiBody = {
    from(parent: Element, state: DrxDocumentState): DrxApiBody | undefined {
        const element = DrxDom.getNode(parent, NodeType.ApiBody);
        return element ? DrxApiBody.parse(element, state) : undefined;
    },
    parse(element: Element, state: DrxDocumentState): DrxApiBody {
        const body: DrxApiBody = {
            id: DrxDom.getAttribute(element, 'id') ?? $Id.guid(),
            type: DrxDom.getAttribute(element, 'type') ?? 'any'
        };
        state.apiBodies[body.id] = body;
        return body;
    },
    to(body: DrxApiBody): Element {
        const element = document.createElement(NodeType.ApiBody);
        DrxDom.setAttribute(element, 'id', body.id);
        DrxDom.setAttribute(element, 'type', body.type);
        return element;
    }
};
