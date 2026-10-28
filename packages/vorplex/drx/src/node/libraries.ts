import type { DrxScope } from '../document';
import { DrxDom } from '../dom';
import { NodeType } from './node-type';

export const DrxLibraries = class {

    public static parse(element: Element): Record<string, string> {
        return DrxDom.getJsonContent(element);
    }

    public static to(libraries: Record<string, string>): Element {
        const element = document.createElement(NodeType.Libraries);
        DrxDom.setJsonContent(element, libraries);
        return element;
    }

    public static getEntryUrl(url: string): string {
        try {
            const resolved = new URL(url);
            if (!/\.html?$/i.test(resolved.pathname)) resolved.pathname = `${resolved.pathname.replace(/\/?$/, '/')}index.html`;
            return resolved.href;
        } catch {
            return url;
        }
    }

    public static getNamespace(reference: string): string | undefined {
        const separator = reference?.indexOf('.') ?? -1;
        return separator === -1 ? undefined : reference.slice(0, separator);
    }

    public static resolve(scope: DrxScope, reference: string): { scope: DrxScope; name: string } | undefined {
        const namespace = DrxLibraries.getNamespace(reference);
        if (namespace === undefined) return { scope, name: reference };
        const library = scope.document.libraries.value[namespace];
        if (!library) return;
        return { scope: { document: library, type: 'app' }, name: reference.slice(namespace.length + 1) };
    }

}
