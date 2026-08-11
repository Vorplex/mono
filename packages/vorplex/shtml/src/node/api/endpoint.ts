import { $Id } from '@vorplex/core';
import { ShtmlDocumentState } from '../../shtml';
import { ShtmlDom } from '../../shtml-dom';
import { NodeType } from '../node-type';
import { ShtmlApiBody } from './body';
import { ShtmlApiHeader } from './header';
import { ShtmlApiParameter } from './parameter';
import { ShtmlApiResponse } from './response';

export interface ShtmlApiEndpoint {
    id: string;
    name: string;
    path: string;
    method: string;
    parameterIds: string[];
    headerIds: string[];
    bodyId?: string;
    responseId?: string;
}

export const ShtmlApiEndpoint = {
    from(parent: Element, state: ShtmlDocumentState): ShtmlApiEndpoint[] {
        const elements = Array.from(parent.querySelectorAll(`:scope > ${NodeType.ApiEndpoint}`));
        return elements.map(element => ShtmlApiEndpoint.parse(element, state));
    },
    parse(element: Element, state: ShtmlDocumentState): ShtmlApiEndpoint {
        const parameters = ShtmlApiParameter.from(element, state);
        const headers = ShtmlApiHeader.from(element, state);
        const body = ShtmlApiBody.from(element, state);
        const response = ShtmlApiResponse.from(element, state);
        const endpoint: ShtmlApiEndpoint = {
            id: ShtmlDom.getAttribute(element, 'id') ?? $Id.guid(),
            name: ShtmlDom.getRequiredAttribute(element, 'name'),
            path: ShtmlDom.getRequiredAttribute(element, 'path'),
            method: (ShtmlDom.getAttribute(element, 'method') ?? 'GET').toUpperCase(),
            parameterIds: parameters.map(parameter => parameter.id),
            headerIds: headers.map(header => header.id),
            bodyId: body?.id,
            responseId: response?.id
        };
        state.apiEndpoints[endpoint.id] = endpoint;
        return endpoint;
    },
    to(endpoint: ShtmlApiEndpoint, state: ShtmlDocumentState): Element {
        const element = document.createElement(NodeType.ApiEndpoint);
        element.setAttribute('id', endpoint.id);
        element.setAttribute('name', endpoint.name);
        element.setAttribute('path', endpoint.path);
        element.setAttribute('method', endpoint.method);
        for (const id of endpoint.parameterIds) element.appendChild(ShtmlApiParameter.to(state.apiParameters[id]));
        for (const id of endpoint.headerIds) element.appendChild(ShtmlApiHeader.to(state.apiHeaders[id]));
        if (endpoint.bodyId) element.appendChild(ShtmlApiBody.to(state.apiBodies[endpoint.bodyId]));
        if (endpoint.responseId) element.appendChild(ShtmlApiResponse.to(state.apiResponses[endpoint.responseId]));
        return element;
    }
};
