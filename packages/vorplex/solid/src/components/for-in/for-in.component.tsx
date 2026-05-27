import { For, type JSX } from 'solid-js';

export interface ForInProps<TKey extends string, TValue> {
    each: Record<TKey, TValue>;
    children: (value: () => TValue, key: TKey) => JSX.Element;
    fallback?: JSX.Element;
}

export function ForIn<TKey extends string, TValue>(props: ForInProps<TKey, TValue>) {
    return (
        <For
            each={Object.keys(props.each)}
            fallback={props.fallback}
        >
            {(key) => props.children(() => props.each[key] as TValue, key as TKey)}
        </For>
    );
}
