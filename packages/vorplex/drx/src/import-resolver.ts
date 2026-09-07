import { $Path, Awaitable } from '@vorplex/core';
import { DrxDom } from './drx-dom';

export const ImportResolver = {
    async resolve(drx: string, resolve: (path: string) => Awaitable<string>, base: string = ''): Promise<Document> {
        const dom = new DOMParser().parseFromString(drx, 'text/html');
        for (const element of Array.from(dom.body.querySelectorAll('x-import'))) {
            const src = DrxDom.getRequiredAttribute(element, 'src');
            const path = $Path.join(base, src);
            if (path.endsWith('.ts')) {
                const script = dom.createElement('script');
                script.setAttribute('type', 'application/typescript');
                script.textContent = await resolve(path);
                element.replaceWith(script);
            } else if (path.endsWith('.css')) {
                const style = dom.createElement('style');
                style.textContent = await resolve(path);
                element.replaceWith(style);
            } else {
                const nested = await ImportResolver.resolve(await resolve(path), resolve, $Path.getDirectory(path));
                element.replaceWith(...Array.from(nested.body.childNodes));
            }
        }
        return dom;
    }
};
