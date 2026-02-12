import { $Id, $String, Emitter, State } from '@vorplex/core';

export class $CSS {
    private static state = new State<null | 'busy' | 'loaded'>(null);
    private static worker: Worker;
    private static messages = new Emitter<MessageEvent>();

    public static async init() {
        if ($CSS.state.value === null) {
            $CSS.state.update('busy');
            const response = await fetch('https://unpkg.com/sass.js/dist/sass.worker.js');
            const content = await response.text();
            const url = URL.createObjectURL(new Blob([content], { type: 'text/javascript' }));
            $CSS.worker = new Worker(url);
            $CSS.worker.addEventListener('message', (event) => $CSS.messages.emit(event), false);
            $CSS.state.update('loaded');
        }
    }

    public static async compileScss(scss: string): Promise<string> {
        $CSS.init();
        await $CSS.state.until((state) => state.value === 'loaded');
        const id = $Id.uuid();
        $CSS.worker.postMessage({
            id,
            command: 'compile',
            args: [scss],
        });
        const message = await $CSS.messages.until((message) => message.data.id === id);
        return message.data.result.text;
    }

    public static getRules(css: string): CSSStyleRule[] {
        const sheet = new CSSStyleSheet();
        const rules = css
            .split('}')
            .map((rule) => rule.trim())
            .filter((rule) => rule)
            .map((rule) => rule + '}');
        for (const rule of rules) {
            try {
                sheet.insertRule(rule);
            } catch (error) {
                console.error(error);
            }
        }
        return (Array.from(sheet.rules) as CSSStyleRule[]).filter((rule) => rule?.selectorText);
    }

    public static getStyleProperties(style: CSSStyleDeclaration) {
        const properties: Record<string, string> = {};
        for (let i = 0; i < style.length; i++) {
            const property = style.item(i);
            let value = style.getPropertyValue(property).trim();
            if (value.startsWith('url(')) {
                value = value.replace('~', window.location.origin + window.location.pathname);
                if (value.indexOf('^') < 6) {
                    value = value.replace('^', '');
                }
            }
            properties[$String.camelCase(property)] = value;
        }
        return properties;
    }

    public static getProperties(css: string): Record<string, Record<string, string>> | null {
        try {
            const rules = $CSS.getRules(css);
            const properties: Record<string, Record<string, string>> = {};
            for (const rule of rules) {
                if (!rule.selectorText.startsWith('@')) {
                    properties[rule.selectorText] = $CSS.getStyleProperties(rule.style);
                }
            }
            return properties;
        } catch {
            return null;
        }
    }

    public static fromProperties(style: Record<string, Record<string, string>>): string {
        let css = '';
        for (const selector of Object.keys(style).reverse()) {
            css += `${selector} {\n${Object.keys(style[selector])
                .map((property) => `\t${property}: ${style[selector][property]};`)
                .join('\n')}\n}\n`;
        }
        return css;
    }

    public static toStyleAttribute(style: Record<string, string>): string {
        let css = '';
        for (const property in style) {
            css += `${property}: ${style[property]};`;
        }
        return css;
    }
}
