import { Component, createMemo, Show } from 'solid-js';

export function defineComponent<TProps extends object>(render: Component<TProps>): Component<TProps> {
    return (props: TProps) => {
        const keys = Object.keys(props);
        const values = createMemo(
            () => keys.map(key => props[key]),
            [],
            { equals: (a, b) => a.every((value, index) => value === b[index]) }
        );
        return (
            <Show when={values()} keyed>
                {(_: any) => render(props)}
            </Show>

        );
    };
}
