import { $String, Signal } from '@vorplex/core';
import { $Element } from '@vorplex/web';
import { ShtmlAsset } from './node/asset';
import { PreviewContext } from './preview-context';

export const ExpressionParser = {
    invoke(expression: string, locals: Record<string, any>) {
        try {
            const names = Object.keys(locals);
            const func = new Function(...names, expression);
            return func(...names.map(name => locals[name]));
        } catch (error) {
            console.error(`Failed to evaluate expression (${expression})`, { error, locals });
            throw error;
        }
    },
    evaluate(expression: string, locals: Record<string, any>) {
        return ExpressionParser.invoke(`return (${expression})`, locals);
    },
    parse(source: string, locals: Record<string, any>): any {
        const values = [];
        for (const segment of $String.matchDelimited(source, ['{{', '}}'])) {
            if (segment.type === 'text') {
                values.push(segment.value);
                continue;
            }
            const value = ExpressionParser.evaluate(segment.value, locals);
            values.push(value);
        }
        if (values.length === 1) return values[0];
        return values.join('');
    },
    bind(source: string, locals: Record<string, any>, callback: (value: any) => void): void {
        Signal.effect(() => {
            const value = ExpressionParser.parse(source, locals);
            callback(value);
        });
    },
    isLiteral(source: string): boolean {
        return $String.matchDelimited(source, ['{{', '}}']).every(segment => segment.type === 'text');
    },
    isLocal(source: string): { name: string; path: string } | null {
        const segments = $String.matchDelimited(source, ['{{', '}}']);
        if (segments.length !== 1 || segments[0].type !== 'match') return null;
        const match = /^([A-Za-z_$][\w$]*)((?:\.[A-Za-z_$][\w$]*)*)\(\)$/.exec(segments[0].value.trim());
        if (!match) return null;
        return { name: match[1], path: match[2].replace(/^\./, '') };
    },
    isAsset(source: string): string {
        return /^\{\{\s*asset\.([A-Za-z_$][\w$]*)\s*\}\}$/.exec(source.trim())?.[1];
    },
    bindAttributes(element: HTMLElement | SVGElement, attributes: Record<string, string>, locals: Record<string, any>): void {
        for (const [name, value] of Object.entries(attributes)) {
            if ($Element.isEventAttribute(element, name)) {
                element.addEventListener(name.slice(2), event => ExpressionParser.invoke(value, { ...locals, event }));
            } else if (name.startsWith('class.')) {
                const className = name.slice('class.'.length);
                ExpressionParser.bind(value, locals, active => element.classList.toggle(className, !!active));
            } else if (name.startsWith('style.')) {
                const property = name.slice('style.'.length);
                ExpressionParser.bind(value, locals, style => {
                    if (style == null || style === false) element.style.removeProperty(property);
                    else element.style.setProperty(property, String(style));
                });
            } else {
                ExpressionParser.bind(value, locals, resolved => {
                    if (resolved == null || resolved === false) element.removeAttribute(name);
                    else element.setAttribute(name, resolved === true ? '' : String(resolved));
                });
            }
        }
    },
    applyPreviewAttributes(element: HTMLElement | SVGElement, attributes: Record<string, string>, context: PreviewContext) {
        for (const attribute of [...element.attributes]) {
            element.removeAttribute(attribute.name);
        }
        for (const [name, value] of Object.entries(attributes)) {
            const assetReference = ExpressionParser.isAsset(value);
            if (assetReference) {
                const assetIds = context.componentId ? context.root.proxy.components[context.componentId].assetIds() : context.root.proxy.app.assetIds();
                const asset = assetIds
                    .map(id => context.root.proxy.assets[id]())
                    .find(asset => asset.name === assetReference);
                if (!asset) continue;
                const url = (context.resolveAsset ?? ShtmlAsset.resolveUrl)(asset);
                if (!url) continue;
                element.setAttribute(name, url);
                continue;
            }
            if (!ExpressionParser.isLiteral(value)) continue;
            if ($Element.isEventAttribute(element, name)) continue;
            if (name.startsWith('class.')) {
                if (value) element.classList.add(name.slice('class.'.length));
                continue;
            }
            if (name.startsWith('style.')) {
                element.style.setProperty(name.slice('style.'.length), value);
                continue;
            }
            element.setAttribute(name, value);
        }
    }
};
