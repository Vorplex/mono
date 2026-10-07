import { Getter, Signal } from '@vorplex/core';

interface DocumentRules {
    sheet: CSSStyleSheet;
    css?: string;
    count: number;
}

export class DrxStyleSheet {

    private static readonly documentRules = new Map<Document, Map<string, DocumentRules>>();

    public static create(realm: Window, css: Getter<string | undefined>): CSSStyleSheet {
        const sheet = new (realm as unknown as { CSSStyleSheet: typeof CSSStyleSheet }).CSSStyleSheet();
        Signal.effect(() => sheet.replaceSync(css() ?? ''));
        return sheet;
    }

    public static adopt(shadow: ShadowRoot | Document, ...sheets: (Getter<string> | CSSStyleSheet)[]): void {
        const view = 'defaultView' in shadow ? shadow.defaultView : shadow.ownerDocument.defaultView;
        shadow.adoptedStyleSheets = sheets.map(entry => typeof entry === 'function' ? DrxStyleSheet.create(view, entry) : entry);
    }

    public static attach(document: Document, sheet: CSSStyleSheet): void {
        document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
        Signal.cleanup(() => document.adoptedStyleSheets = document.adoptedStyleSheets.filter(entry => entry !== sheet));
    }

    public static registerDocumentRules(document: Document, key: string, css: Getter<string | undefined>): void {
        const realm = document.defaultView as unknown as { CSSStyleSheet: typeof CSSStyleSheet; CSSFontFaceRule: typeof CSSFontFaceRule; CSSPropertyRule: typeof CSSPropertyRule };
        const registry = this.documentRules.get(document) ?? new Map<string, DocumentRules>();
        this.documentRules.set(document, registry);
        const entry = registry.get(key) ?? { sheet: new realm.CSSStyleSheet(), count: 0 };
        registry.set(key, entry);
        entry.count++;
        Signal.effect(() => {
            const text = css() ?? '';
            if (entry.css === text) return;
            entry.css = text;
            const source = new realm.CSSStyleSheet();
            source.replaceSync(text);
            const rules = Array
                .from(source.cssRules)
                .filter(rule => rule instanceof realm.CSSFontFaceRule || rule instanceof realm.CSSPropertyRule);
            entry.sheet.replaceSync('');
            for (const rule of rules) entry.sheet.insertRule(rule.cssText, entry.sheet.cssRules.length);
            const adopted = document.adoptedStyleSheets.includes(entry.sheet);
            if (rules.length && !adopted) document.adoptedStyleSheets = [...document.adoptedStyleSheets, entry.sheet];
            if (!rules.length && adopted) document.adoptedStyleSheets = document.adoptedStyleSheets.filter(sheet => sheet !== entry.sheet);
        });
        Signal.cleanup(() => {
            entry.count--;
            if (entry.count) return;
            document.adoptedStyleSheets = document.adoptedStyleSheets.filter(sheet => sheet !== entry.sheet);
            registry.delete(key);
        });
    }

}
