import { $String, Signal } from '@vorplex/core';
import { $Element } from '@vorplex/web';

export class DrxExpression {

    public static isLiteral(expression: string): boolean {
        return expression != null && $String.matchDelimited(expression, ['{{', '}}']).every(segment => segment.type === 'text');
    }

    public static isLocal(expression: string): { name: string; path: string[] } | null {
        if (expression == null) return null;
        const segments = $String.matchDelimited(expression, ['{{', '}}']);
        if (segments.length !== 1 || segments[0].type !== 'match') return null;
        return DrxExpression.isPureLocal(segments[0].value);
    }

    public static isPureLocal(expression: string): { name: string; path: string[] } | null {
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
    }

    public static isAsset(expression: string): string {
        if (expression == null) return null;
        return /^\{\{\s*asset\.([A-Za-z_$][\w$]*)\s*\}\}$/.exec(expression.trim())?.[1];
    }

    public static mask(content: string): string {
        const maximumExpressionLength = 25;
        const expressionPlaceholder = 'ƒ';
        const matchAt = (pattern: RegExp, value: string, index: number): RegExpExecArray | null => {
            pattern.lastIndex = index;
            return pattern.exec(value);
        };
        try {
            return $String.matchDelimited(content, ['{{', '}}'])
                .map(segment => {
                    if (segment.type === 'text') return segment.value;
                    const root = matchAt(/\s*([A-Za-z_$][\w$]*)/y, segment.value, 0);
                    if (!root) return expressionPlaceholder;
                    let index = root[0].length;
                    const accesses: string[] = [];
                    while (true) {
                        const access = matchAt(/\s*(?:\.\s*([A-Za-z_$][\w$]*)|\[\s*("(?:\\[^\n\r\u2028\u2029]|[^"\\\n\r\u2028\u2029])*"|'(?:\\[^\n\r\u2028\u2029]|[^'\\\n\r\u2028\u2029])*'|\d+)\s*\])/y, segment.value, index);
                        if (!access) break;
                        accesses.push(access[1] ? `.${access[1]}` : `[${access[2]}]`);
                        index += access[0].length;
                    }
                    const call = matchAt(/\s*\(\s*\)/y, segment.value, index);
                    if (call) index += call[0].length;
                    if (!matchAt(/\s*$/y, segment.value, index)) return expressionPlaceholder;
                    const normalized = `${root[1]}${accesses.join('')}`;
                    if (normalized.length <= maximumExpressionLength) return `{${normalized}}`;
                    for (let start = 0; start <= accesses.length; start++) {
                        const candidate = `...${accesses.slice(start).join('').replace(/^\./, '')}`;
                        if (candidate.length <= maximumExpressionLength) return `{{${candidate}}}`;
                    }
                    return expressionPlaceholder;
                })
                .join('');
        } catch {
            return content;
        }
    }

    constructor(protected readonly realm: typeof globalThis = globalThis) { }

    public invoke(expression: string, locals: Record<string, any>, thisArg?: unknown) {
        const names = Object.keys(locals);
        return new this.realm.Function(...names, expression).apply(thisArg, names.map(name => locals[name]));
    }

    public evaluate(expression: string, locals: Record<string, any>) {
        return this.invoke(`return (${expression})`, locals);
    }

    public parse(source: string, locals: Record<string, any>): any {
        const values = [];
        for (const segment of $String.matchDelimited(source, ['{{', '}}'])) {
            if (segment.type === 'text') {
                values.push(segment.value);
                continue;
            }
            const value = this.evaluate(segment.value, locals);
            if (typeof value === 'function') throw new Error(`"{{${segment.value.trim()}}}" is a signal or function and should be called: {{${segment.value.trim()}()}}`);
            values.push(value);
        }
        if (values.length === 1) return values[0];
        return values.join('');
    }

    public bind(source: string, locals: Record<string, any>, callback: (value: any) => void): void {
        Signal.effect(() => {
            const value = this.parse(source, locals);
            callback(value);
        });
    }

    public bindExpression(expression: string, locals: Record<string, any>, callback: (value: any) => void): void {
        Signal.effect(() => callback(this.evaluate(expression, locals)));
    }

    public bindAttributes(element: HTMLElement | SVGElement, attributes: Record<string, string>, locals: Record<string, any>): void {
        for (const [name, value] of Object.entries(attributes)) {
            if ($Element.isEventAttribute(element, name)) {
                const handler = (event: Event) => {
                    const result = this.invoke(value, { ...locals, event }, element);
                    if (result === false) event.preventDefault();
                };
                element.addEventListener(name.slice(2), handler);
                Signal.cleanup(() => element.removeEventListener(name.slice(2), handler));
            } else if (name.startsWith('class.')) {
                const className = name.slice('class.'.length);
                this.bindExpression(value, locals, active => element.classList.toggle(className, !!active));
                Signal.cleanup(() => element.classList.remove(className));
            } else if (name.startsWith('style.')) {
                const property = name.slice('style.'.length);
                this.bindExpression(value, locals, style => {
                    if (style == null || style === false) element.style.removeProperty(property);
                    else element.style.setProperty(property, String(style));
                });
                Signal.cleanup(() => element.style.removeProperty(property));
            } else if (name === 'class') {
                let applied: string[] = [];
                this.bind(value, locals, resolved => {
                    const next = resolved == null || resolved === false ? [] : String(resolved).split(/\s+/).filter(Boolean);
                    for (const className of applied) if (!next.includes(className)) element.classList.remove(className);
                    for (const className of next) element.classList.add(className);
                    applied = next;
                });
                Signal.cleanup(() => { for (const className of applied) element.classList.remove(className); });
            } else if (name === 'html') {
                this.bind(value, locals, html => {
                    element.innerHTML = html == null || html === false ? '' : String(html);
                });
                Signal.cleanup(() => element.replaceChildren());
            } else {
                this.bind(value, locals, resolved => {
                    if (['value', 'checked', 'selected', 'indeterminate'].includes(name) && name in element) {
                        const next = name === 'value' ? (resolved == null || resolved === false ? '' : String(resolved)) : !!resolved;
                        if ((element as any)[name] !== next) (element as any)[name] = next;
                        if (name === 'indeterminate') return;
                    }
                    if (resolved == null || resolved === false) element.removeAttribute(name);
                    else element.setAttribute(name, resolved === true ? '' : String(resolved));
                });
                Signal.cleanup(() => {
                    element.removeAttribute(name);
                    if (['value', 'checked', 'selected', 'indeterminate'].includes(name) && name in element) {
                        (element as any)[name] = name === 'value' ? '' : false;
                    }
                });
            }
        }
    }

}
