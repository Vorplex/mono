import { $Id } from '@vorplex/core';
import { ShtmlDocumentState } from '../shtml';
import { ShtmlDom } from '../shtml-dom';
import { NodeType } from './node-type';

export interface ShtmlService {
    id: string;
    name: string;
    script: string;
}

export const ShtmlService = {
    from(parent: Element, state: ShtmlDocumentState): ShtmlService[] {
        const elements = Array.from(parent.querySelectorAll(`:scope > ${NodeType.Service}`));
        return elements.map(element => ShtmlService.parse(element, state));
    },
    parse(element: Element, state: ShtmlDocumentState): ShtmlService {
        const service: ShtmlService = {
            id: ShtmlDom.getAttribute(element, 'id') ?? $Id.guid(),
            name: ShtmlDom.getRequiredAttribute(element, 'name'),
            script: ShtmlDom.getScript(element)
        };
        state.services[service.id] = service;
        return service;
    },
    to(service: ShtmlService): Element {
        const element = document.createElement(NodeType.Service);
        element.setAttribute('id', service.id);
        element.setAttribute('name', service.name);
        ShtmlDom.createScript(element, service.script);
        return element;
    }
};
