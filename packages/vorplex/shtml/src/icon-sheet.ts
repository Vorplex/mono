let symbols: Map<string, Element>;

export const IconSheet = {
    async load(): Promise<void> {
        if (symbols) return;
        symbols = new Map<string, Element>();
        const response = await fetch('https://cdn.jsdelivr.net/npm/lucide-static/sprite.svg');
        const text = await response.text();
        const sheet = new DOMParser().parseFromString(text, 'image/svg+xml');
        for (const symbol of Array.from(sheet.querySelectorAll('symbol'))) symbols.set(symbol.id, symbol);
    },
    apply(svg: SVGElement, name: string): void {
        const symbol = symbols?.get(name);
        if (!symbol) {
            svg.replaceChildren(...[]);
            return;
        }
        const attributes = {
            viewBox: symbol.getAttribute('viewBox'),
            width: symbol.getAttribute('width') ?? '1em',
            height: symbol.getAttribute('height') ?? '1em',
            fill: symbol.getAttribute('fill') ?? 'none',
            stroke: symbol.getAttribute('stroke') ?? 'currentColor',
            'stroke-width': symbol.getAttribute('stroke-width') ?? '2',
            'stroke-linecap': symbol.getAttribute('stroke-linecap') ?? 'round',
            'stroke-linejoin': symbol.getAttribute('stroke-linejoin') ?? 'round'
        };
        for (const [attribute, value] of Object.entries(attributes)) {
            if (svg.hasAttribute(attribute) || !value) continue;
            svg.setAttribute(attribute, value);
        }
        svg.replaceChildren(...Array.from(symbol.childNodes).map(child => child.cloneNode(true)));
    }
};
