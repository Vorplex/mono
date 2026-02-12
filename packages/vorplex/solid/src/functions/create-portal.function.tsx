import { createMemo, type JSX } from 'solid-js';
import { render } from 'solid-js/web';
import { createStyle } from './create-style.function';

export type Portal = {
    container: HTMLDivElement;
    destroy: () => void;
};

const classes = createStyle(() => ({
    container: {
        position: 'fixed',
        left: '0px',
        top: '0px',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        pointerEvents: 'none',
        '& > *': {
            pointerEvents: 'initial',
        },
    },
}));

export interface PortalOptions {
    render: (portal: Portal) => JSX.Element,
    onDestroy?: () => void
}

export function createPortal(options: PortalOptions): Portal {
    const container = document.createElement('div');
    container.style.zIndex = '1';
    createMemo(() => container.className = classes().container);
    document.body.appendChild(container);
    let disposed = false;
    const portal: Portal = {
        container,
        destroy: () => {
            if (dispose) dispose();
            else disposed = true;
            container.remove();
            options.onDestroy?.();
        },
    };
    const dispose = disposed ? () => { } : render(() => options.render(portal), container);
    return portal;
}
