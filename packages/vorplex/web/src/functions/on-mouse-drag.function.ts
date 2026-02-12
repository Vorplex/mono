import { $Number, $Point, type Point } from '@vorplex/core';

export interface MouseDragEvent {
    mouseEvent: MouseEvent;
    currentElement: HTMLElement;
    delta: Point;
    length: Point;
}

export interface MouseDragOptions {
    event: MouseEvent;
    snap?: number;
    dragging?: (event: MouseDragEvent) => void;
    dragged?: (delta: Point) => void;
    resizing?: (event: MouseDragEvent) => void;
    resized?: (delta: Point) => void;
}

export function onMouseDrag(options: MouseDragOptions) {
    options.event.stopPropagation();
    const currentElement = options.event.currentTarget as HTMLElement;
    let action: 'drag' | 'resize' = 'drag';
    if (options.resizing || options.resized) {
        const rect = currentElement.getBoundingClientRect();
        if (options.event.clientX === $Number.clamp(options.event.clientX, rect.left + rect.width - 15, rect.left + rect.width)) {
            if (options.event.clientY === $Number.clamp(options.event.clientY, rect.top + rect.height - 15, rect.top + rect.height)) {
                action = 'resize';
            }
        }
    }
    const snap = options.snap || 1;
    const origin = $Point.create($Number.snap(options.event.clientX, snap), $Number.snap(options.event.clientY, snap));
    let delta = origin;
    const mouseMoveListener = (event: MouseEvent) => {
        const dragEvent: MouseDragEvent = {
            mouseEvent: options.event,
            currentElement,
            delta: {
                x: $Number.snap(event.clientX - delta.x, snap),
                y: $Number.snap(event.clientY - delta.y, snap),
            },
            length: {
                x: $Number.snap(event.clientX - origin.x, snap),
                y: $Number.snap(event.clientY - origin.y, snap),
            },
        };
        if (dragEvent.length.x !== 0 || dragEvent.length.y !== 0) {
            if (action === 'drag') {
                options.dragging && options.dragging(dragEvent);
            } else {
                options.resizing && options.resizing(dragEvent);
            }
        }
        delta = $Point.create($Number.snap(event.clientX, snap), $Number.snap(event.clientY, snap));
    };
    const mouseUpListener = ({ clientX, clientY }: MouseEvent) => {
        document.removeEventListener('mousemove', mouseMoveListener, {
            capture: true,
        });
        const delta = $Point.snap($Point.create(clientX - options.event.clientX, clientY - options.event.clientY), snap);
        if (delta.x !== 0 || delta.y !== 0) {
            if (action === 'drag') {
                options.dragged && options.dragged(delta);
            } else {
                options.resized && options.resized(delta);
            }
        }
    };
    document.addEventListener('mousemove', mouseMoveListener, {
        capture: true,
    });
    document.addEventListener('mouseup', mouseUpListener, {
        capture: true,
        once: true,
    });
}
