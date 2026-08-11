import { Getter, Signal } from '@vorplex/core';

export const StyleSheet = {
    create(realm: Window, css: Getter<string | undefined>): CSSStyleSheet {
        const sheet = new realm.CSSStyleSheet();
        Signal.effect(() => sheet.replaceSync(css() ?? ''));
        return sheet;
    },
    adopt(shadow: ShadowRoot, ...sheets: (Getter<string | undefined> | CSSStyleSheet)[]): void {
        shadow.adoptedStyleSheets = sheets.map(entry => typeof entry === 'function' ? StyleSheet.create(shadow.ownerDocument.defaultView, entry) : entry);
    }
};
