import { $Id } from '@vorplex/core';
import { DrxDocumentState } from '../drx';
import { DrxDom } from '../drx-dom';
import { NodeType } from './node-type';

export interface DrxService {
    id: string;
    name: string;
    script: string;
}

export const DrxService = {
    from(parent: Element, state: DrxDocumentState): DrxService[] {
        const elements = Array.from(parent.querySelectorAll(`:scope > ${NodeType.Service}`));
        return elements.map(element => DrxService.parse(element, state));
    },
    parse(element: Element, state: DrxDocumentState): DrxService {
        const service: DrxService = {
            id: DrxDom.getAttribute(element, 'id') ?? $Id.guid(),
            name: DrxDom.getRequiredAttribute(element, 'name'),
            script: DrxDom.getScript(element)
        };
        state.services[service.id] = service;
        return service;
    },
    to(service: DrxService): Element {
        const element = document.createElement(NodeType.Service);
        DrxDom.setAttribute(element, 'id', service.id);
        DrxDom.setAttribute(element, 'name', service.name);
        DrxDom.createScript(element, service.script);
        return element;
    }
};
