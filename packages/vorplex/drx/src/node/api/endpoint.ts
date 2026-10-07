import { DrxDom } from '../../dom';
import type { DrxDocumentState } from '../../document';
import { NodeType } from '../node-type';
import type { DrxTemplateItem } from '../template-item';
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

export const DrxApiEndpoint = class {

    public static parse(element: Element, state: DrxDocumentState): DrxApiEndpoint {
        const parameters = DrxDom.parseChildren(element, NodeType.ApiParameter, child => DrxApiParameter.parse(child, state));
        const headers = DrxDom.parseChildren(element, NodeType.ApiHeader, child => DrxApiHeader.parse(child, state));
        const body = DrxDom.parseChildren(element, NodeType.ApiBody, child => DrxApiBody.parse(child, state))[0];
        const response = DrxDom.parseChildren(element, NodeType.ApiResponse, child => DrxApiResponse.parse(child, state))[0];
        const endpoint: DrxApiEndpoint = {
            id: DrxDom.getId(element),
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
    }

    public static to(endpoint: DrxApiEndpoint, state: DrxDocumentState): Element {
        const element = document.createElement(NodeType.ApiEndpoint);
        DrxDom.setAttribute(element, 'id', endpoint.id);
        DrxDom.setAttribute(element, 'name', endpoint.name);
        DrxDom.setAttribute(element, 'path', endpoint.path);
        DrxDom.setAttribute(element, 'method', endpoint.method);
        for (const id of endpoint.parameterIds) element.appendChild(DrxApiParameter.to(state.apiParameters[id]));
        for (const id of endpoint.headerIds) element.appendChild(DrxApiHeader.to(state.apiHeaders[id]));
        if (endpoint.bodyId) element.appendChild(DrxApiBody.to(state.apiBodies[endpoint.bodyId]));
        if (endpoint.responseId) element.appendChild(DrxApiResponse.to(state.apiResponses[endpoint.responseId]));
        return element;
    }

    public static children(endpoint: DrxApiEndpoint): DrxTemplateItem[] {
        return [
            ...endpoint.parameterIds.map(id => ({ type: NodeType.ApiParameter, id })),
            ...endpoint.headerIds.map(id => ({ type: NodeType.ApiHeader, id })),
            ...(endpoint.bodyId ? [{ type: NodeType.ApiBody, id: endpoint.bodyId }] : []),
            ...(endpoint.responseId ? [{ type: NodeType.ApiResponse, id: endpoint.responseId }] : [])
        ];
    }

}
