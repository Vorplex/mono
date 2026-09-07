import { $Id } from '@vorplex/core';
import { DrxDocumentState } from '../../drx';
import { DrxDom } from '../../drx-dom';
import { NodeType } from '../node-type';
import { DrxApiBody } from './body';
import { DrxApiHeader } from './header';
import { DrxApiParameter } from './parameter';
import { DrxApiResponse } from './response';

export interface DrxApiEndpoint {
    id: string;
    name: string;
    path: string;
    method: string;
    parameterIds: string[];
    headerIds: string[];
    bodyId?: string;
    responseId?: string;
}

export const DrxApiEndpoint = {
    from(parent: Element, state: DrxDocumentState): DrxApiEndpoint[] {
        const elements = Array.from(parent.querySelectorAll(`:scope > ${NodeType.ApiEndpoint}`));
        return elements.map(element => DrxApiEndpoint.parse(element, state));
    },
    parse(element: Element, state: DrxDocumentState): DrxApiEndpoint {
        const parameters = DrxApiParameter.from(element, state);
        const headers = DrxApiHeader.from(element, state);
        const body = DrxApiBody.from(element, state);
        const response = DrxApiResponse.from(element, state);
        const endpoint: DrxApiEndpoint = {
            id: DrxDom.getAttribute(element, 'id') ?? $Id.guid(),
            name: DrxDom.getRequiredAttribute(element, 'name'),
            path: DrxDom.getRequiredAttribute(element, 'path'),
            method: (DrxDom.getAttribute(element, 'method') ?? 'GET').toUpperCase(),
            parameterIds: parameters.map(parameter => parameter.id),
            headerIds: headers.map(header => header.id),
            bodyId: body?.id,
            responseId: response?.id
        };
        state.apiEndpoints[endpoint.id] = endpoint;
        return endpoint;
    },
    to(endpoint: DrxApiEndpoint, state: DrxDocumentState): Element {
        const element = document.createElement(NodeType.ApiEndpoint);
        element.setAttribute('id', endpoint.id);
        element.setAttribute('name', endpoint.name);
        element.setAttribute('path', endpoint.path);
        element.setAttribute('method', endpoint.method);
        for (const id of endpoint.parameterIds) element.appendChild(DrxApiParameter.to(state.apiParameters[id]));
        for (const id of endpoint.headerIds) element.appendChild(DrxApiHeader.to(state.apiHeaders[id]));
        if (endpoint.bodyId) element.appendChild(DrxApiBody.to(state.apiBodies[endpoint.bodyId]));
        if (endpoint.responseId) element.appendChild(DrxApiResponse.to(state.apiResponses[endpoint.responseId]));
        return element;
    }
};
