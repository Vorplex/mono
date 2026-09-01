import { $String } from '@vorplex/core';
import { NodeType } from './node/node-type';

export const ShtmlDom = {
    getAttribute(element: Element, attribute: string) {
        return element?.getAttribute(attribute);
    },
    getRequiredAttribute(element: Element, attribute: string) {
        return element?.getAttribute(attribute);
    },
    getBooleanAttribute(element: Element, attribute: string) {
        return element?.getAttribute(attribute) === 'true';
    },
    getNode(element: Element, type: NodeType) {
        return element?.querySelector(`:scope > ${type}`);
    },
    createNode(element: Element, type: NodeType) {
        const node = document.createElement(type);
        element.appendChild(node);
        return node;
    },
    getNodes(element: Element, type: NodeType) {
        return Array.from(element?.querySelectorAll(`:scope > ${type}`) ?? []);
    },
    getScript(element: Element) {
        return $String.dedent(element?.querySelector(`:scope > script[type="application/typescript"]`)?.textContent);
    },
    getStyle(element: Element) {
        return $String.dedent(element?.querySelector(`:scope > style`)?.textContent);
    },
    getContent(element: Element) {
        return $String.dedent(element?.innerHTML);
    },
    getJsonContent(element: Element) {
        return element?.textContent ? JSON.parse(element.textContent) : null;
    },
    createScript(element: Element, script?: string) {
        if (script == null) return;
        const node = document.createElement('script');
        node.setAttribute('type', 'application/typescript');
        node.textContent = script;
        element.appendChild(node);
    },
    createStyle(element: Element, style?: string) {
        if (style == null) return;
        const node = document.createElement('style');
        node.textContent = style;
        element.appendChild(node);
    },
    setJsonContent(element: Element, value: any) {
        element.textContent = JSON.stringify(value);
    }
};
