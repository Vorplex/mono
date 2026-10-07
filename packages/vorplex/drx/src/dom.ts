import { $Id, $String, Awaitable } from '@vorplex/core';
import { NodeType } from './node/node-type';

export const DrxDom = class {

    public static async bootstrap<T>(target: Element, callback: () => Awaitable<T>): Promise<T | undefined> {
        const container = target.ownerDocument.createElement('div');
        container.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            box-sizing: border-box;
            color: #1f2329;
        `;
        container.innerHTML = `
            <style>@keyframes drx-spin { to { transform: rotate(360deg); } }</style>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="animation: drx-spin 0.75s linear infinite;">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
        `;
        target.replaceChildren(container);
        try { return await callback(); }
        catch (error) {
            const pre = target.ownerDocument.createElement('pre');
            pre.style.cssText = `
                white-space: pre-wrap;
                color: #b00020;
                font: 13px/1.5 ui-monospace, monospace;
                padding: 16px;
                margin: 0;
                overflow: auto;
                width: 100%;
                height: 100%;
                box-sizing: border-box;
            `;
            pre.textContent = Error.isError(error) ? (error.stack ?? error.message) : String(error);
            target.replaceChildren(pre);
            throw error;
        }
        finally { container.remove(); }
    }

    public static getAttribute(element: Element, attribute: string) {
        return element?.getAttribute(attribute);
    }

    public static getId(element: Element): string {
        return element?.getAttribute('id') ?? $Id.guid();
    }

    public static getAttributes(element: Element, ...excluded: string[]): Record<string, string> {
        return Object.fromEntries(element.getAttributeNames().filter(name => !excluded.includes(name)).map(name => [name, element.getAttribute(name)]));
    }

    public static parseChildren<T>(element: Element, type: NodeType, parse: (child: Element) => T): T[] {
        return DrxDom.getNodes(element, type).map(child => parse(child));
    }

    public static getRequiredAttribute(element: Element, attribute: string) {
        return element?.getAttribute(attribute);
    }

    public static getBooleanAttribute(element: Element, attribute: string) {
        const value = element?.getAttribute(attribute);
        return value === 'true' || value === '';
    }

    public static createNode(element: Element, type: NodeType) {
        const node = element.ownerDocument.createElement(type);
        element.appendChild(node);
        return node;
    }

    public static getNodes(element: Element, type: NodeType) {
        return Array.from(element?.querySelectorAll(`:scope > ${type}`) ?? []);
    }

    public static getScript(element: Element) {
        return $String.dedent(element?.querySelector(`:scope > script[type="application/typescript"]`)?.textContent);
    }

    public static getStyle(element: Element) {
        return $String.dedent(element?.querySelector(`:scope > style`)?.textContent);
    }

    public static getContent(element: Element) {
        return $String.dedent(element?.innerHTML);
    }

    public static getJsonContent(element: Element) {
        return element?.textContent ? JSON.parse(element.textContent) : null;
    }

    public static createScript(element: Element, script?: string) {
        if (script == null) return;
        const node = element.ownerDocument.createElement('script');
        node.setAttribute('type', 'application/typescript');
        node.textContent = script;
        element.appendChild(node);
    }

    public static createStyle(element: Element, style?: string) {
        if (style == null) return;
        const node = element.ownerDocument.createElement('style');
        node.textContent = style;
        element.appendChild(node);
    }

    public static setJsonContent(element: Element, value: any) {
        element.textContent = JSON.stringify(value);
    }

    public static setAttribute(element: Element, attribute: string, value: string | null | undefined) {
        if (value != null) element.setAttribute(attribute, value);
    }

    public static isSvg(parent: Node): boolean {
        if (parent?.nodeType !== Node.ELEMENT_NODE) return false;
        const element = parent as Element;
        return element.namespaceURI === 'http://www.w3.org/2000/svg' && element.localName !== 'foreignObject';
    }

    public static createElement(parent: Node, tag: string): HTMLElement | SVGElement {
        if (tag === 'svg' || DrxDom.isSvg(parent)) return parent.ownerDocument.createElementNS('http://www.w3.org/2000/svg', tag);
        return parent.ownerDocument.createElement(tag);
    }

    public static createHost(parent: Node, type: NodeType): HTMLElement | SVGElement {
        if (DrxDom.isSvg(parent)) return parent.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'g');
        const host = parent.ownerDocument.createElement(type);
        host.style.display = 'contents';
        return host;
    }

}
