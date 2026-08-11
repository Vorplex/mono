let symbols: Map<string, Element>;

export const IconSheet = {
    async load(): Promise<void> {
        if (symbols) return;
        symbols = new Map<string, Element>();
        const response = await fetch('https://cdn.jsdelivr.net/npm/lucide-static/sprite.svg');
        const text = await response.text();
        const sheet = new DOMParser().parseFromString(text, 'image/svg+xml');
        for (const symbol of Array.from(sheet.querySelectorAll('symbol'))) {
            if (!symbol.hasAttribute('width')) symbol.setAttribute('width', '1em');
            if (!symbol.hasAttribute('height')) symbol.setAttribute('height', '1em');
            if (!symbol.hasAttribute('fill')) symbol.setAttribute('fill', 'none');
            if (!symbol.hasAttribute('stroke')) symbol.setAttribute('stroke', 'currentColor');
            if (!symbol.hasAttribute('stroke-width')) symbol.setAttribute('stroke-width', '2');
            if (!symbol.hasAttribute('stroke-linecap')) symbol.setAttribute('stroke-linecap', 'round');
            if (!symbol.hasAttribute('stroke-linejoin')) symbol.setAttribute('stroke-linejoin', 'round');
            symbols.set(symbol.id, symbol);
        }
    },
    get(name: string): Element | undefined {
        return symbols?.get(name);
    }
};
