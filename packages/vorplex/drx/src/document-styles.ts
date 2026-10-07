import { Signal } from '@vorplex/core';

interface DocumentStyleMirror {
    observer: MutationObserver;
    roots: Set<ShadowRoot>;
    copies: Map<Element, Map<ShadowRoot, Element>>;
}

export class DrxDocumentStyles {

    private static readonly mirrors = new Map<Document, DocumentStyleMirror>();

    public static mirror(root: ShadowRoot): void {
        const document = root.ownerDocument;
        const mirror = DrxDocumentStyles.get(document);
        mirror.roots.add(root);
        for (const source of DrxDocumentStyles.sources(document)) DrxDocumentStyles.copy(mirror, source, root);
        Signal.cleanup(() => {
            mirror.roots.delete(root);
            for (const copies of mirror.copies.values()) copies.delete(root);
            if (mirror.roots.size) return;
            mirror.observer.disconnect();
            this.mirrors.delete(document);
        });
    }

    public static isSource(node: Node): node is HTMLStyleElement | HTMLLinkElement {
        if (node.nodeType !== Node.ELEMENT_NODE) return false;
        const element = node as Element;
        if (element.tagName === 'STYLE') return true;
        return element.tagName === 'LINK' && (element as HTMLLinkElement).relList.contains('stylesheet');
    }

    public static sources(document: Document): Element[] {
        return Array.from(document.head?.children ?? []).filter(element => DrxDocumentStyles.isSource(element));
    }

    public static get(document: Document): DocumentStyleMirror {
        if (!this.mirrors.has(document)) {
            const mirror: DocumentStyleMirror = {
                observer: new MutationObserver(records => DrxDocumentStyles.sync(document, mirror, records)),
                roots: new Set(),
                copies: new Map()
            };
            if (document.head) mirror.observer.observe(document.head, { childList: true, subtree: true, characterData: true, attributes: true });
            this.mirrors.set(document, mirror);
        }
        return this.mirrors.get(document);
    }

    public static copy(mirror: DocumentStyleMirror, source: Element, root: ShadowRoot): void {
        const copies = mirror.copies.get(source) ?? new Map<ShadowRoot, Element>();
        mirror.copies.set(source, copies);
        copies.get(root)?.remove();
        const copy = source.cloneNode(true) as Element;
        copy.setAttribute('data-drx-document-style', '');
        const sources = DrxDocumentStyles.sources(source.ownerDocument);
        const next = sources
            .slice(sources.indexOf(source) + 1)
            .map(sibling => mirror.copies.get(sibling)?.get(root))
            .find(sibling => sibling?.parentNode === root);
        const previous = sources
            .slice(0, sources.indexOf(source))
            .reverse()
            .map(sibling => mirror.copies.get(sibling)?.get(root))
            .find(sibling => sibling?.parentNode === root);
        root.insertBefore(copy, next ?? previous?.nextSibling ?? root.firstChild);
        copies.set(root, copy);
    }

    public static remove(mirror: DocumentStyleMirror, source: Element): void {
        for (const copy of mirror.copies.get(source)?.values() ?? []) copy.remove();
        mirror.copies.delete(source);
    }

    public static sync(document: Document, mirror: DocumentStyleMirror, records: MutationRecord[]): void {
        const changed = new Set<Element>();
        for (const record of records) {
            for (const node of Array.from(record.removedNodes)) {
                if (DrxDocumentStyles.isSource(node) && !node.isConnected) DrxDocumentStyles.remove(mirror, node);
            }
            const target = record.target.nodeType === Node.ELEMENT_NODE ? record.target as Element : record.target.parentElement;
            const source = target?.closest('style, link');
            if (source && source.parentElement === document.head) changed.add(source);
            for (const node of Array.from(record.addedNodes)) {
                if (DrxDocumentStyles.isSource(node) && node.parentElement === document.head) changed.add(node);
            }
        }
        for (const source of changed) {
            if (!DrxDocumentStyles.isSource(source)) {
                DrxDocumentStyles.remove(mirror, source);
                continue;
            }
            for (const root of mirror.roots) DrxDocumentStyles.copy(mirror, source, root);
        }
    }

}
