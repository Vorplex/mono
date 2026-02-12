import { For, type JSX } from 'solid-js';

export interface ForInProps<TKey extends string, TValue> {
    each: Record<TKey, TValue>;
    children: (value: TValue, key: TKey) => JSX.Element;
}

export function ForIn<T extends string, TT>(props: ForInProps<T, TT>) {
    return (
        <For each={Object.entries(props.each)}>{([key, value]) => props.children(value as TT, key as T)}</For>
    );
}
