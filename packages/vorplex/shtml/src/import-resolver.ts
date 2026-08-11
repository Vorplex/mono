import { $Path, Awaitable } from '@vorplex/core';

export const ImportResolver = {
    // <x-import> is a source-level text splice, resolved before compilation -- not a runtime module reference.
    // `base` is the importing file's own directory, so a nested file's relative `src` resolves against where
    // that file actually lives, not the root entry file.
    async resolve(shtml: string, resolve: (path: string) => Awaitable<string>, base: string = ''): Promise<Document> {
        const dom = new DOMParser().parseFromString(shtml, 'text/html');
        for (const element of Array.from(dom.body.querySelectorAll('x-import'))) {
            const src = element.getAttribute('src');
            if (!src) throw new Error('<x-import> is missing its "src" attribute');
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
