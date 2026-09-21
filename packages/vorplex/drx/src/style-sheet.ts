import { Getter, Signal } from '@vorplex/core';

export const StyleSheet = {
    create(realm: Window, css: Getter<string | undefined>): CSSStyleSheet {
        const sheet = new (realm as unknown as { CSSStyleSheet: typeof CSSStyleSheet }).CSSStyleSheet();
        Signal.effect(() => sheet.replaceSync(css() ?? ''));
        return sheet;
    },
    clone(realm: Window, sheet: CSSStyleSheet): CSSStyleSheet | undefined {
        try {
            const cssText = Array
                .from(sheet.cssRules)
                .map(rule => rule.cssText)
                .join('\n');
            const constructed = new (realm as unknown as { CSSStyleSheet: typeof CSSStyleSheet }).CSSStyleSheet();
            constructed.replaceSync(cssText);
            return constructed;
        } catch {
            return undefined;
        }
    },
    adopt(shadow: ShadowRoot | Document, ...sheets: (Getter<string> | CSSStyleSheet)[]): void {
        const view = 'defaultView' in shadow ? shadow.defaultView : shadow.ownerDocument.defaultView;
        shadow.adoptedStyleSheets = sheets.map(entry => typeof entry === 'function' ? StyleSheet.create(view, entry) : entry);
    }
};
