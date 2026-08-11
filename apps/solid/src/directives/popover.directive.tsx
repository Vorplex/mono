import { $Id } from '@vorplex/core';
import { createPortal, createStyle } from '@vorplex/solid';
import type { Accessor, JSXElement } from 'solid-js';
import { createSignal, onCleanup, Show } from 'solid-js';
import { Theme } from '../consts/theme';

export interface PopoverDirectiveProps {
    content: () => JSXElement;
    /**
     * Sets the position of the popover.
     * @example
     * position: { top: 'anchor(bottom)', left: 'anchor(left)' }
     */
    position: {
        top?: string;
        right?: string;
        bottom?: string;
        left?: string;
    };
}

const classes = createStyle(() => ({
    popover: {
        gap: '5px',
        position: 'fixed',
        marginBlock: '10px',
        borderRadius: '5px',
        overflow: 'hidden',
        border: `1px solid ${Theme().outline.primary}`,
        padding: '10px',
        background: Theme().secondary.color,
        color: Theme().secondary.text,
        boxShadow: `0px 0px 5px ${Theme().shadow}`,
        minWidth: '200px',
        '&:popover-open': {
            display: 'grid'
        }
    }
}));

export function PopoverDirective(element: HTMLElement, props: Accessor<PopoverDirectiveProps>) {
    const id = $Id.uuid();
    const anchorName = `--anchor-${id}`;
    const [open, setOpen] = createSignal(false);

    element.setAttribute('popovertarget', id);
    element.style['anchorName'] = anchorName;

    const portal = createPortal({
        render: () => (
            <div
                id={id}
                popover
                class={classes().popover}
                style={{
                    'position-anchor': anchorName,
                    ...props().position
                }}
                onToggle={(event) => setOpen(event.newState === 'open')}
                onClick={(e) => (e.currentTarget as HTMLElement & { hidePopover(): void }).hidePopover()}
            >
                <Show when={open()}>
                    {props().content()}
                </Show>
            </div>
        )
    });

    onCleanup(() => portal.destroy());
}
