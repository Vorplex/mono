import { $Number, $Point, Size, type Point, type Rect } from '@vorplex/core';
import { $Element } from '@vorplex/web';
import { createSignal, onCleanup, onMount, type JSXElement } from 'solid-js';
import { createPortal, type Portal } from './create-portal.function';

export enum PopupPosition {
    Top = 1 << 0,
    Bottom = 1 << 1,
    Left = 1 << 2,
    Right = 1 << 3,
}

export enum PopupSize {
    Width = 1 << 0,
    Height = 1 << 1,
}

interface PopupOptionsBase {
    ghost?: boolean;
    interactive?: boolean;
    autoPosition?: boolean;
    render: (menu: Portal) => JSXElement;
    onDestroy?: () => void;
}

interface AnchorPopupOptions extends PopupOptionsBase {
    anchor: {
        element: HTMLElement;
        position: PopupPosition;
        size?: PopupSize;
    };
}

interface LocationPopupOptions extends PopupOptionsBase {
    location: Point;
}

export type PopupOptions = AnchorPopupOptions | LocationPopupOptions;

function LocationPopup(props: { options: LocationPopupOptions; portal: Portal }) {
    return (
        <div
            style={{
                position: 'fixed',
                top: `${props.options.location.y}px`,
                left: `${props.options.location.x}px`,
                transform: props.options.autoPosition
                    ? `translate(${props.options.location.x > window.innerWidth / 2 ? '-100%' : '0%'}, ${props.options.location.y > window.innerHeight / 2 ? '-100%' : '0%'})`
                    : undefined,
                'pointer-events': props.options.interactive ? 'auto' : undefined,
            }}
        >
            {props.options.render(props.portal)}
        </div>
    );
}

function AnchoredPopup(props: { options: AnchorPopupOptions; portal: Portal }) {
    const resolveStatic = (anchorRect: Rect, position: PopupPosition): { point: Point; transform: string } => {
        const bounds = $Element.getBoundsFromRect(anchorRect);
        const top = (position & PopupPosition.Top) !== 0;
        const left = (position & PopupPosition.Left) !== 0;
        const right = (position & PopupPosition.Right) !== 0 && !left;
        const point = top
            ? (left ? bounds.topLeft : right ? bounds.topRight : bounds.topCenter)
            : (left ? bounds.bottomLeft : right ? bounds.bottomRight : bounds.bottomCenter);
        return { point, transform: `translate(${left ? '0%' : right ? '-100%' : '-50%'}, ${top ? '-100%' : '0%'})` };
    };

    const resolveFitted = (anchorRect: Rect, position: PopupPosition, size: Size, viewport: Size, minSize: Size): { point: Point; maxSize: Size } => {
        let top = (position & PopupPosition.Top) !== 0;
        let left = (position & PopupPosition.Left) !== 0;
        let right = (position & PopupPosition.Right) !== 0 && !left;

        const fitsAbove = anchorRect.y - size.height >= 0;
        const fitsBelow = anchorRect.y + anchorRect.height + size.height <= viewport.height;
        if (top && !fitsAbove && fitsBelow) top = false;
        else if (!top && !fitsBelow && fitsAbove) top = true;

        const fitsLeftAligned = anchorRect.x + size.width <= viewport.width;
        const fitsRightAligned = anchorRect.x + anchorRect.width - size.width >= 0;
        if (left && !fitsLeftAligned && fitsRightAligned) { left = false; right = true; }
        else if (right && !fitsRightAligned && fitsLeftAligned) { right = false; left = true; }

        const centerX = anchorRect.x + anchorRect.width / 2;
        const availableWidth = Math.max(0, left
            ? viewport.width - anchorRect.x
            : right
                ? anchorRect.x + anchorRect.width
                : 2 * Math.min(centerX, viewport.width - centerX));
        const availableHeight = Math.max(0, top ? anchorRect.y : viewport.height - (anchorRect.y + anchorRect.height));

        const maxWidth = Math.max(availableWidth, minSize.width);
        const maxHeight = Math.max(availableHeight, minSize.height);

        const clampedWidth = Math.min(size.width, maxWidth);
        const clampedHeight = Math.min(size.height, maxHeight);

        const x = left ? anchorRect.x : right ? anchorRect.x + anchorRect.width - clampedWidth : anchorRect.x + anchorRect.width / 2 - clampedWidth / 2;
        const y = top ? anchorRect.y - clampedHeight : anchorRect.y + anchorRect.height;

        return {
            point: $Point.create(
                $Number.clamp(x, 0, Math.max(0, viewport.width - clampedWidth)),
                $Number.clamp(y, 0, Math.max(0, viewport.height - clampedHeight)),
            ),
            maxSize: { width: maxWidth, height: maxHeight },
        };
    };

    const { anchor, autoPosition } = props.options;
    const anchorRect = anchor.element.getBoundingClientRect();
    const initial = resolveStatic(anchorRect, anchor.position);
    const [point, setPoint] = createSignal<Point>(initial.point);
    const [transform, setTransform] = createSignal<string | undefined>(initial.transform);
    const [maxWidth, setMaxWidth] = createSignal('');
    const [maxHeight, setMaxHeight] = createSignal('');
    const [ready, setReady] = createSignal(!autoPosition);
    let elementRef: HTMLDivElement | undefined;

    const width = anchor.size && (anchor.size & PopupSize.Width) ? `${anchorRect.width}px` : '';
    const height = anchor.size && (anchor.size & PopupSize.Height) ? `${anchorRect.height}px` : '';

    onMount(() => {
        if (!autoPosition || !elementRef) return;
        const anchorRect = anchor.element.getBoundingClientRect();
        const size = { width: elementRef.offsetWidth, height: elementRef.offsetHeight };
        const contentStyle = elementRef.firstElementChild ? getComputedStyle(elementRef.firstElementChild) : undefined;
        const minSize = {
            width: contentStyle ? parseFloat(contentStyle.minWidth) || 0 : 0,
            height: contentStyle ? parseFloat(contentStyle.minHeight) || 0 : 0,
        };
        const viewport = { width: window.innerWidth, height: window.innerHeight };
        const fitted = resolveFitted(anchorRect, anchor.position, size, viewport, minSize);
        setPoint(fitted.point);
        setMaxWidth(`${fitted.maxSize.width}px`);
        setMaxHeight(`${fitted.maxSize.height}px`);
        setTransform(undefined);
        setReady(true);
    });

    return (
        <div
            ref={elementRef}
            style={{
                position: 'fixed',
                top: `${point().y}px`,
                left: `${point().x}px`,
                transform: transform(),
                visibility: ready() ? 'visible' : 'hidden',
                'pointer-events': props.options.interactive ? 'auto' : undefined,
                width,
                height,
                'max-width': maxWidth(),
                'max-height': maxHeight(),
                overflow: 'auto',
            }}
        >
            {props.options.render(props.portal)}
        </div>
    );
}

export function createPopup(options: PopupOptions): Portal {
    const portal = createPortal({
        render: (portal) => {

            onMount(() => {
                const dispose = $Element.addEventListener(document, 'keyup', event => {
                    if (event.code === 'Escape') portal.destroy();
                });
                onCleanup(() => dispose());
            });

            return (
                <div
                    style={{
                        position: 'fixed',
                        top: '0px',
                        left: '0px',
                        border: 'none',
                        width: '100vw',
                        height: '100vh',
                        'pointer-events': options.ghost ? 'none' : 'initial',
                    }}
                    onPointerUp={(event) => {
                        if (options.ghost) return;
                        if (event.currentTarget !== event.target) return;
                        portal.destroy();
                    }}
                >
                    {(options as AnchorPopupOptions).anchor
                        ? <AnchoredPopup options={options as AnchorPopupOptions} portal={portal} />
                        : <LocationPopup options={options as LocationPopupOptions} portal={portal} />
                    }
                </div>
            );
        },
        onDestroy: options.onDestroy
    });
    return portal;
}
