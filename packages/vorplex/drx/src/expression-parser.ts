import { $String, Signal } from '@vorplex/core';
import { $Element } from '@vorplex/web';
import { DrxAsset } from './node/asset';
import { PreviewContext } from './preview-context';

export const DrxExpressionParser = {
    invoke(expression: string, locals: Record<string, any>, thisArg?: unknown) {
        try {
            const names = Object.keys(locals);
            const func = new Function(...names, expression);
            return func.apply(thisArg, names.map(name => locals[name]));
        } catch (error) {
            throw error;
        }
    },
    evaluate(expression: string, locals: Record<string, any>) {
        return DrxExpressionParser.invoke(`return (${expression})`, locals);
    },
    parse(source: string, locals: Record<string, any>): any {
        const values = [];
        for (const segment of $String.matchDelimited(source, ['{{', '}}'])) {
            if (segment.type === 'text') {
                values.push(segment.value);
                continue;
            }
            const value = DrxExpressionParser.evaluate(segment.value, locals);
            values.push(value);
        }
        if (values.length === 1) return values[0];
        return values.join('');
    },
    bind(source: string, locals: Record<string, any>, callback: (value: any) => void): void {
        Signal.effect(() => {
            const value = DrxExpressionParser.parse(source, locals);
            callback(value);
        });
    },
    bindExpression(expression: string, locals: Record<string, any>, callback: (value: any) => void): void {
        Signal.effect(() => callback(DrxExpressionParser.evaluate(expression, locals)));
    },
    isLiteral(expression: string): boolean {
        return expression != null && $String.matchDelimited(expression, ['{{', '}}']).every(segment => segment.type === 'text');
    },
    isLocal(expression: string): { name: string; path: string[] } | null {
        if (expression == null) return null;
        const segments = $String.matchDelimited(expression, ['{{', '}}']);
        if (segments.length !== 1 || segments[0].type !== 'match') return null;
        return DrxExpressionParser.isPureLocal(segments[0].value);
    },
    isPureLocal(expression: string): { name: string; path: string[] } | null {
        if (expression == null) return null;
        const marker = Object.freeze(Object.create(null));
        const calls: { name: string; path: string[] }[] = [];
        const record = (name: string, path: string[]): any => new Proxy(() => { }, {
            get: (_target, key) => typeof key === 'string' ? record(name, [...path, key]) : undefined,
            apply: (_target, _this, args) => {
                if (args.length > 0) throw new Error('Unexpected arguments');
                calls.push({ name, path });
                return marker;
            }
        });
        const scope = new Proxy({}, {
            has: () => true,
            get: (_target, key) => typeof key === 'string' ? record(key, []) : undefined
        });
        try {
            const result = new Function('scope', `with (scope) { return (function () { 'use strict'; return (${expression}); })(); }`)(scope);
            return result === marker && calls.length === 1 ? calls[0] : null;
        } catch {
            return null;
        }
    },
    isAsset(expression: string): string {
        if (expression == null) return null;
        return /^\{\{\s*asset\.([A-Za-z_$][\w$]*)\s*\}\}$/.exec(expression.trim())?.[1];
    },
    bindAttributes(element: HTMLElement | SVGElement, attributes: Record<string, string>, locals: Record<string, any>): void {
        for (const [name, value] of Object.entries(attributes)) {
            if ($Element.isEventAttribute(element, name)) {
                element.addEventListener(name.slice(2), event => {
                    const result = DrxExpressionParser.invoke(value, { ...locals, event }, element);
                    if (result === false) event.preventDefault();
                });
            } else if (name.startsWith('class.')) {
                const className = name.slice('class.'.length);
                DrxExpressionParser.bindExpression(value, locals, active => element.classList.toggle(className, !!active));
            } else if (name.startsWith('style.')) {
                const property = name.slice('style.'.length);
                DrxExpressionParser.bindExpression(value, locals, style => {
                    if (style == null || style === false) element.style.removeProperty(property);
                    else element.style.setProperty(property, String(style));
                });
            } else if (name === 'class') {
                let applied: string[] = [];
                DrxExpressionParser.bind(value, locals, resolved => {
                    const next = resolved == null || resolved === false ? [] : String(resolved).split(/\s+/).filter(Boolean);
                    for (const className of applied) if (!next.includes(className)) element.classList.remove(className);
                    for (const className of next) element.classList.add(className);
                    applied = next;
                });
            } else if (name === 'html') {
                DrxExpressionParser.bind(value, locals, html => {
                    element.innerHTML = html == null || html === false ? '' : String(html);
                });
            } else {
                DrxExpressionParser.bind(value, locals, resolved => {
                    if (['value', 'checked', 'selected', 'indeterminate'].includes(name) && name in element) {
                        const next = name === 'value' ? (resolved == null || resolved === false ? '' : String(resolved)) : !!resolved;
                        if ((element as any)[name] !== next) (element as any)[name] = next;
                        if (name === 'indeterminate') return;
                    }
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
            const assetReference = DrxExpressionParser.isAsset(value);
            if (assetReference) {
                const assetIds = context.componentId ? context.root.proxy.components[context.componentId].assetIds() : context.root.proxy.app.assetIds();
                const asset = assetIds
                    .map(id => context.root.proxy.assets[id]())
                    .find(asset => asset.name === assetReference);
                if (!asset) continue;
                const url = (context.resolveAsset ?? DrxAsset.resolveUrl)(asset);
                if (!url) continue;
                element.setAttribute(name, url);
                continue;
            }
            if (name.startsWith('class.') || name.startsWith('style.')) continue;
            if (!DrxExpressionParser.isLiteral(value)) continue;
            if ($Element.isEventAttribute(element, name)) continue;
            if (name === 'html') {
                element.innerHTML = value;
                continue;
            }
            element.setAttribute(name, value);
        }
    }
};
