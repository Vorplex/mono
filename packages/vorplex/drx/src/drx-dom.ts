import { $String, Awaitable } from '@vorplex/core';
import { NodeType } from './node/node-type';

export const DrxDom = {
    async bootstrap<T>(target: Element, callback: () => Awaitable<T>): Promise<T | undefined> {
        const container = target.ownerDocument.createElement('div');
        container.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: center;
                width:100%;
                height:100%;
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
            console.error(error);
            const pre = target.ownerDocument.createElement('pre');
            pre.style.cssText = `
                white-space: pre-wrap;
                    color: #b00020;
                    font: 13px/1.5 ui-monospace, monospace;
                    padding: 16px;
                    margin:0;
                    overflow: auto;
                    width:100%;
                    height:100%;
                    box-sizing: border-box;
                    `;
            pre.textContent = Error.isError(error) ? (error.stack ?? error.message) : String(error);
            target.replaceChildren(pre);
        }
        finally { container.remove(); }
    },
    getAttribute(element: Element, attribute: string) {
        return element?.getAttribute(attribute);
    },
    getRequiredAttribute(element: Element, attribute: string) {
        return element?.getAttribute(attribute);
    },
    getBooleanAttribute(element: Element, attribute: string) {
        const value = element?.getAttribute(attribute);
        return value === 'true' || value === '';
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
    },
    setAttribute(element: Element, attribute: string, value: string | null | undefined) {
        if (value != null) element.setAttribute(attribute, value);
    }
};
