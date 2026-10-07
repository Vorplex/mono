import { DrxDom } from '../dom';
import type { DrxDocumentState } from '../document';
import { NodeType } from './node-type';

export interface DrxService {
    id: string;
    name: string;
    script: string;
}

export const DrxService = class {

    public static parse(element: Element, state: DrxDocumentState): DrxService {
        const service: DrxService = {
            id: DrxDom.getId(element),
            name: DrxDom.getRequiredAttribute(element, 'name'),
            script: DrxDom.getScript(element)
        };
        state.services[service.id] = service;
        return service;
    }

    public static to(service: DrxService): Element {
        const element = document.createElement(NodeType.Service);
        DrxDom.setAttribute(element, 'id', service.id);
        DrxDom.setAttribute(element, 'name', service.name);
        DrxDom.createScript(element, service.script);
        return element;
    }

}
