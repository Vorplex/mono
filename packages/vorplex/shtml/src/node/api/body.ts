import { $Id } from '@vorplex/core';
import { ShtmlDocumentState } from '../../shtml';
import { ShtmlDom } from '../../shtml-dom';
import { NodeType } from '../node-type';

export interface ShtmlApiBody {
    id: string;
    definition: string;
}

export const ShtmlApiBody = {
    from(parent: Element, state: ShtmlDocumentState): ShtmlApiBody | undefined {
        const element = ShtmlDom.getNode(parent, NodeType.ApiBody);
        return element ? ShtmlApiBody.parse(element, state) : undefined;
    },
    parse(element: Element, state: ShtmlDocumentState): ShtmlApiBody {
        const body: ShtmlApiBody = {
            id: ShtmlDom.getAttribute(element, 'id') ?? $Id.guid(),
            definition: ShtmlDom.getAttribute(element, 'type') ?? 'any'
        };
        state.apiBodies[body.id] = body;
        return body;
    },
    to(body: ShtmlApiBody): Element {
        const element = document.createElement(NodeType.ApiBody);
        element.setAttribute('id', body.id);
        element.setAttribute('type', body.definition);
        return element;
    }
};
