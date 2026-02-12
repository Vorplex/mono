import { $Value } from '@vorplex/core';

export function observeElement(element: HTMLElement, observer: { onTransform: (current: DOMRect, previous: DOMRect) => void }): () => void {
    let disposed = false;
    let previousRect = element.getBoundingClientRect();

    function observe() {
        requestAnimationFrame(() => {
            const rect = element.getBoundingClientRect();
            if (!$Value.equals(rect, previousRect)) {
                observer.onTransform(rect, previousRect);
            }
            previousRect = rect;
            if (!disposed) observe();
        });
    }
    observe();
    return () => { disposed = true };
}
