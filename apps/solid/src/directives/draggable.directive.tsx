import { Point } from '@vorplex/core';
import { createPortal, Portal } from '@vorplex/solid';
import { $Element } from '@vorplex/web';
import { Accessor, createMemo, createSignal, JSXElement, onCleanup } from 'solid-js';

export interface DraggableDirectiveProps {
    disabled?: boolean;
    type: string;
    data: any;
    ghost?: JSXElement;
}

let DRAG_DATA: { element: HTMLElement, type: string; data: any; };

export function DraggableDirective(element: HTMLElement, props: Accessor<DraggableDirectiveProps>) {
    let listeners: (() => void)[] = [];
    let ghostPortal: Portal;
    const cleanup = () => {
        for (const listener of listeners) listener();
        ghostPortal?.destroy();
    };
    createMemo(() => {
        cleanup();
        const properties = props();
        element.draggable = !properties.disabled;
        const [ghostPosition, setGhostPosition] = createSignal<Point>();
        listeners.push($Element.addEventListener(element, 'dragstart', event => {
            DRAG_DATA = {
                element: event.currentTarget as HTMLElement,
                type: properties.type,
                data: properties.data
            };
            if (properties.ghost) {
                setGhostPosition({ x: event.clientX, y: event.clientY });
                ghostPortal = createPortal({
                    render: () => (
                        <div style={{ position: 'fixed', left: `${ghostPosition().x + 10}px`, top: `${ghostPosition().y}px` }}>
                            {properties.ghost}
                        </div>
                    )
                });
                event.dataTransfer.setDragImage(document.createElement('fragment'), -10, 10);
            }
        }));
        listeners.push($Element.addEventListener(element, 'drag', event => {
            setGhostPosition({ x: event.clientX, y: event.clientY });
        }));
        listeners.push($Element.addEventListener(element, 'dragend', event => {
            DRAG_DATA = null;
            ghostPortal?.destroy();
        }));
    });
    onCleanup(() => cleanup());
}

export const DropzoneAcceptArea = {
    Top: 'top',
    Middle: 'middle',
    Bottom: 'bottom'
} as const;
export type DropzoneAcceptArea = typeof DropzoneAcceptArea[keyof typeof DropzoneAcceptArea];

export interface DropzoneAccept<T = any> {
    condition?: (args: { data: T, event: DragEvent, area: DropzoneAcceptArea }) => boolean;
    accepting?: (args: { data: T, event: DragEvent, area: DropzoneAcceptArea }) => (() => void) | void;
    dropped: (args: { data: T, area: DropzoneAcceptArea }) => void;
}

export interface DropzoneDirectiveProps {
    accepts: Record<string, DropzoneAccept>
}

export function DropzoneDirective(element: HTMLElement, props: Accessor<DropzoneDirectiveProps>) {
    let listeners: (() => void)[] = [];
    let acceptingDispose: () => void;
    const cleanupAccept = () => {
        element.removeAttribute('data-dropzone-accepted');
        element.removeAttribute('data-dropzone-accepted-area');
        acceptingDispose?.();
    };
    const cleanup = () => {
        for (const listener of listeners) listener();
        cleanupAccept();
    };
    const setDropzoneArea = (event: DragEvent) => {
        const rect = element.getBoundingClientRect();
        const heightPercent = ((event.clientY - rect.top) / rect.height) * 100;
        element.setAttribute('data-dropzone-accepted', 'true');
        const area: DropzoneAcceptArea = heightPercent < 33 ? 'top' : heightPercent > 66 ? 'bottom' : 'middle';
        element.setAttribute('data-dropzone-accepted-area', area);
    };
    createMemo(() => {
        cleanup();
        const properties = props();
        listeners.push($Element.addEventListener(element, 'dragover', event => {
            if (event.currentTarget === DRAG_DATA.element) return;
            const accept = properties.accepts[DRAG_DATA.type];
            if (!accept) return;
            if (accept.condition && !accept.condition({ data: DRAG_DATA.data, event, area: element.getAttribute('data-dropzone-accepted-area') as DropzoneAcceptArea })) return;
            setDropzoneArea(event);
            event.preventDefault();
            acceptingDispose = accept.accepting?.({
                data: DRAG_DATA.data,
                event,
                area: element.getAttribute('data-dropzone-accepted-area') as DropzoneAcceptArea
            }) as () => void;
        }));
        listeners.push($Element.addEventListener(element, 'dragleave', event => {
            cleanupAccept();
        }));
        listeners.push($Element.addEventListener(element, 'drop', event => {
            const accept = properties.accepts[DRAG_DATA.type];
            accept.dropped({
                data: DRAG_DATA.data,
                area: element.getAttribute('data-dropzone-accepted-area') as DropzoneAcceptArea
            });
            cleanupAccept();
        }));
    });
    onCleanup(() => cleanup());
}
