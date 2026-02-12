import { createContext, onCleanup, onMount } from 'solid-js';
import { JSX } from 'solid-js/jsx-runtime';
import { render } from 'solid-js/web';

export const ShadowDomContext = createContext<ShadowRoot>();

export function ShadowDomComponent(props: { ref?: (root: ShadowRoot) => void, children: JSX.Element }) {
    let ref: HTMLDivElement;
    onMount(() => {
        const root = ref.attachShadow({ mode: 'open' });
        const dispose = render(() => <ShadowDomContext.Provider value={root}>{props.children}</ShadowDomContext.Provider>, root);
        props.ref?.(root);
        onCleanup(() => dispose?.());
    });
    return <div
        ref={ref}
        style={{ display: 'contents' }}
    />
}
