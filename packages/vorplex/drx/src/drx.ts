import { $Path, Awaitable } from '@vorplex/core';
import { DrxDocument, DrxDocumentState } from './document';
import { DrxDom } from './dom';
import { DrxApp } from './node/app/app';
import { NodeType } from './node/node-type';

export const DRX = class {

    public static async fetch(url: string): Promise<DrxDocument> {
        const base = new URL('.', url).href;
        const source = await fetch(url).then(response => response.text());
        return DRX.load(source, { import: path => fetch(base + path).then(response => response.text()) });
    }

    public static async load(drx: string, options: { import: (path: string) => Awaitable<string>, base?: string }): Promise<DrxDocument> {
        const resolve = async (drx: string, base: string) => {
            const dom = new DOMParser().parseFromString(drx, 'text/html');
            for (const element of Array.from(dom.body.querySelectorAll('x-import'))) {
                const src = DrxDom.getRequiredAttribute(element, 'src');
                const path = $Path.join(base, src);
                if (path.endsWith('.ts')) {
                    const script = dom.createElement('script');
                    script.setAttribute('type', 'application/typescript');
                    script.textContent = await options.import(path);
                    element.replaceWith(script);
                } else if (path.endsWith('.css')) {
                    const style = dom.createElement('style');
                    style.textContent = await options.import(path);
                    element.replaceWith(style);
                } else {
                    const nested = await resolve(await options.import(path), $Path.getDirectory(path));
                    element.replaceWith(...Array.from(nested.body.childNodes));
                }
            }
            return dom;
        };
        return DRX.from(await resolve(drx, options.base ?? ''));
    }

    public static parse(drx: string): DrxDocument {
        return DRX.from(new DOMParser().parseFromString(drx, 'text/html'));
    }

    public static from(dom: Document): DrxDocument {
        const state = DrxDocumentState.new();
        return new DrxDocument({
            ...state,
            app: DrxApp.parse(dom.body.querySelector(`:scope > ${NodeType.App}`), state)
        });
    }

}
