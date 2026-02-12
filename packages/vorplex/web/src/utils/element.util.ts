import { $Point, type Point } from '@vorplex/core';

export class $Element {
    public static getRelativePoint(element: HTMLElement, position: 'top' | 'right' | 'bottom' | 'left', offset: number = 0) {
        const point: Point = $Point.create();
        if (element) {
            const rect = element.getBoundingClientRect();
            if (position === 'top') {
                point.x = rect.x + rect.width / 2;
                point.y = rect.y - offset;
            } else if (position === 'right') {
                point.x = rect.x + rect.width + offset;
                point.y = rect.y + rect.height / 2;
            } else if (position === 'bottom') {
                point.x = rect.x + rect.width / 2;
                point.y = rect.y + rect.height + offset;
            } else if (position === 'left') {
                point.x = rect.x - offset;
                point.y = rect.y + rect.height / 2;
            }
        }
        return point;
    }

    public static getBounds(element: HTMLElement) {
        const rect = element.getBoundingClientRect();
        return {
            width: rect.width,
            height: rect.height,
            topLeft: $Point.create(rect.x, rect.y),
            topCenter: $Point.create(rect.x + rect.width / 2, rect.y),
            topRight: $Point.create(rect.x + rect.width, rect.y),
            rightCenter: $Point.create(rect.x + rect.width, rect.y + rect.height / 2),
            bottomLeft: $Point.create(rect.x, rect.y + rect.height),
            bottomCenter: $Point.create(rect.x + rect.width / 2, rect.y + rect.height),
            bottomRight: $Point.create(rect.x + rect.width, rect.y + rect.height),
            leftCenter: $Point.create(rect.x, rect.y + rect.height / 2),
        };
    }

    public static addEventListener<T extends Document | HTMLElement, TT extends T extends Document ? DocumentEventMap : HTMLElementEventMap, TTT extends string & keyof TT>(element: T, type: TTT, listener: (event: TT[TTT], listener: { remove: () => void }) => any, options?: boolean | AddEventListenerOptions) {
        const remove = () => element.removeEventListener(type, handler);
        const handler = event => listener(event, { remove });
        element.addEventListener(type, handler, options);
        return remove;
    }

    public static getEventProperties(elementTag: string): string[] {
        const target = document.createElement(elementTag);
        const events: string[] = [];
        for (const key in target) {
            if (key.startsWith('on') && key.length > 2) {
                events.push(key);
            }
        }
        return events.sort();
    }
}
