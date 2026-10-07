import { Signal } from '@vorplex/core';

export class DrxIconSheet {

    public static readonly url = 'https://cdn.jsdelivr.net/npm/lucide-static/sprite.svg';

    private static readonly symbols = Signal.create<Map<string, Element>>();

    private static loading: Promise<void> | undefined;

    public static load(url: string = this.url): Promise<void> {
        if (!this.loading) {
            this.loading = (async () => {
                const response = await fetch(url);
                const text = await response.text();
                const sheet = new DOMParser().parseFromString(text, 'image/svg+xml');
                const map = new Map<string, Element>();
                for (const symbol of Array.from(sheet.querySelectorAll('symbol'))) map.set(symbol.id, symbol);
                this.symbols(map);
            })();
        }
        return this.loading;
    }

    public static apply(svg: SVGElement, name: string): void {
        const symbol = this.symbols()?.get(name);
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

}
