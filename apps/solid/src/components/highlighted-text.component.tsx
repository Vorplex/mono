import { createStyle } from '@vorplex/solid';
import { createMemo, For, Show } from 'solid-js';
import { Theme } from '../consts/theme';

const classes = createStyle(() => ({
    match: {
        color: Theme().accent.color,
        fontWeight: 'bold'
    }
}));

export function HighlightedTextComponent(props: { text: string; indexes: number[] }) {
    const segments = createMemo(() => {
        const matches = new Set(props.indexes);
        const segments: { text: string; match: boolean }[] = [];
        for (let index = 0; index < props.text.length; index++) {
            const match = matches.has(index);
            const last = segments[segments.length - 1];
            if (last && last.match === match) last.text += props.text[index];
            else segments.push({ text: props.text[index], match });
        }
        return segments;
    });

    return (
        <For each={segments()}>
            {segment => (
                <Show
                    when={segment.match}
                    fallback={segment.text}
                >
                    <span
                        class={classes().match}
                        innerText={segment.text}
                    />
                </Show>
            )}
        </For>
    );
}
