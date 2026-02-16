import { For, type JSX } from 'solid-js';

export interface ForInProps<TKey extends string, TValue> {
    each: Record<TKey, TValue>;
    children: (value: TValue, key: TKey) => JSX.Element;
    fallback?: JSX.Element;
}

export function ForIn<TKey extends string, TValue>(props: ForInProps<TKey, TValue>) {
    return (
        <For
            each={Object.entries(props.each)}
            fallback={props.fallback}
        >
            {([key, value]) => props.children(value as TValue, key as TKey)}
        </For>
    );
}
