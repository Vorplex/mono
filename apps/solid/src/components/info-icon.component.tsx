import { createStyle } from '@vorplex/solid';
import { classNames } from '@vorplex/web';
import { Show } from 'solid-js';
import { Theme } from '../consts/theme';

const classes = createStyle(() => ({
    badge: {
        position: 'absolute',
        top: '0px',
        right: '0px',
        minWidth: '8px',
        height: '8px',
        padding: '0',
        borderRadius: '8px',
        background: Theme().accent.color,
        color: Theme().accent.text,
        fontSize: '10px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: '1',
        '&.error': {
            background: Theme().error.outline,
            color: Theme().error.text,
        },
    }
}));

export function InfoIconComponent(props: { type?: 'info' | 'error', hidden?: boolean }) {
    return (
        <Show when={!props.hidden}>
            <div
                class={classNames(classes().badge, { error: props.type === 'error' })}
            />
        </Show>
    );
}
