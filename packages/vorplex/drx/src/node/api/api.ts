import { DrxDom } from '../../dom';
import type { DrxDocumentState } from '../../document';
import { NodeType } from '../node-type';
import type { DrxTemplateItem } from '../template-item';
import { DrxApiEndpoint } from './endpoint';

export interface DrxApi {
    id: string;
    name: string;
    url: string;
    endpointIds: string[];
}

export const DrxApi = class {

    public static parse(element: Element, state: DrxDocumentState): DrxApi {
        const api: DrxApi = {
            id: DrxDom.getId(element),
            name: DrxDom.getRequiredAttribute(element, 'name'),
            url: DrxDom.getRequiredAttribute(element, 'url'),
            endpointIds: DrxDom
                .parseChildren(element, NodeType.ApiEndpoint, child => DrxApiEndpoint.parse(child, state))
                .map(endpoint => endpoint.id)
        };
        state.apis[api.id] = api;
        return api;
    }

    public static to(api: DrxApi, state: DrxDocumentState): Element {
        const element = document.createElement(NodeType.Api);
        DrxDom.setAttribute(element, 'id', api.id);
        DrxDom.setAttribute(element, 'name', api.name);
        DrxDom.setAttribute(element, 'url', api.url);
        for (const id of api.endpointIds) element.appendChild(DrxApiEndpoint.to(state.apiEndpoints[id], state));
        return element;
    }

    public static children(api: DrxApi): DrxTemplateItem[] {
        return [
            ...api.endpointIds.map(id => ({ type: NodeType.ApiEndpoint, id }))
        ];
    }

}
