import { Signal } from '@vorplex/core';

const symbols = Signal.create<Map<string, Element>>();
let loading: Promise<void> | undefined;

export const IconSheet = {
    // Fire-and-forget: callers don't await this before mounting -- `apply` reads the `symbols` signal, so
    // icons already on screen re-render themselves reactively the moment the sprite sheet lands.
    load(): Promise<void> {
        if (!loading) {
            loading = (async () => {
                const response = await fetch('https://cdn.jsdelivr.net/npm/lucide-static/sprite.svg');
                const text = await response.text();
                const sheet = new DOMParser().parseFromString(text, 'image/svg+xml');
                const map = new Map<string, Element>();
                for (const symbol of Array.from(sheet.querySelectorAll('symbol'))) map.set(symbol.id, symbol);
                symbols(map);
            })();
        }
        return loading;
    },
    apply(svg: SVGElement, name: string): void {
        const symbol = symbols()?.get(name);
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
