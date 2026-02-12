import type { Point } from '@vorplex/core';
import { onCleanup, onMount, type JSXElement } from 'solid-js';
import { createPortal, type Portal } from './create-portal.function';
import { $Element } from '@vorplex/web';

export type PopupOptions = {
    location: Point;
    ghost?: boolean;
    autoTransform?: boolean;
    render: (menu: Portal) => JSXElement;
    onDestroy?: () => void;
};

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
                    <div
                        style={{
                            position: 'fixed',
                            top: `${options.location.y}px`,
                            left: `${options.location.x}px`,
                            transform: options.autoTransform ? `translate(${options.location.x > window.innerWidth / 2 ? '-100%' : '0%'}, ${options.location.y > window.innerHeight / 2 ? '-100%' : '0%'})` : undefined
                        }}
                    >
                        {options.render(portal)}
                    </div>
                </div>
            );
        },
        onDestroy: options.onDestroy
    });
    return portal;
}
