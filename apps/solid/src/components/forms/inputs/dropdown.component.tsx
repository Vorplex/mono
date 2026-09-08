import { createPopup, createStyle, PopupPosition, PopupSize, type Portal } from '@vorplex/solid';
import { createEffect, createMemo, createSignal, For, onCleanup, Show } from 'solid-js';
import { Classes, Theme } from '../../../consts/theme';
import { ButtonComponent } from '../../button.component';
import { Icon } from '../../icon.component';

export interface DropdownOption<T extends string = string> {
    value: T;
    label: string;
    group?: string;
}

export interface DropdownFormInput<T extends string = string> {
    disabled?: boolean;
    autoFocus?: boolean;
    value?: string;
    options: DropdownOption<T>[];
    placeholder?: string;
    clearable?: boolean;
    acceptText?: boolean;
    onChange?: (value: T | undefined) => void;
}

const classes = createStyle(() => ({
    container: {
        position: 'relative',
        '& > input:first-child:not(:only-child)': {
            paddingRight: '22px'
        },
        '&:focus-within > *:nth-child(2)': {
            color: Theme().accent.color
        }
    },
    chevron: {
        position: 'absolute',
        top: '50%',
        right: '5px',
        transform: 'translateY(-50%)',
        pointerEvents: 'none',
        color: Theme().outline.primary
    },
    popup: {
        display: 'grid',
        gridAutoRows: 'max-content',
        boxShadow: `0px 0px 5px ${Theme().shadow}`,
        padding: '5px',
        background: Theme().primary.color,
        color: Theme().primary.text,
        border: `1px solid ${Theme().outline.primary}`,
        borderRadius: '5px',
        overflow: 'auto',
        minHeight: 0
    },
    groupLabel: {
        padding: '5px 10px',
        fontWeight: 'bold',
        borderBottom: `1px solid ${Theme().outline.primary}`,
        color: Theme().secondary.subText
    },
    option: {
        justifyContent: 'left'
    }
}));

export function DropdownFormInputComponent<T extends string = string>(props: DropdownFormInput<T>) {
    let inputRef: HTMLInputElement | undefined;
    let popup: Portal | undefined;
    let selectedFromList = false;

    const selectedOption = createMemo(() => props.options.find(option => option.value === props.value));
    const [query, setQuery] = createSignal<string>();
    const displayValue = createMemo(() => query() ?? selectedOption()?.label ?? '');

    const filtered = createMemo(() => {
        const search = (query() ?? '').toLowerCase();
        return props.options.filter(option => option.label.toLowerCase().includes(search));
    });

    const groups = createMemo(() => {
        const ordered: { group?: string; options: DropdownOption<T>[] }[] = [];
        for (const option of filtered()) {
            let bucket = ordered.find(entry => entry.group === option.group);
            if (!bucket) {
                bucket = { group: option.group, options: [] };
                ordered.push(bucket);
            }
            bucket.options.push(option);
        }
        return ordered;
    });

    const flatOptions = createMemo(() => groups().flatMap(group => group.options));
    const [highlightIndex, setHighlightIndex] = createSignal(0);

    createEffect(() => {
        flatOptions();
        setHighlightIndex(0);
    });

    const optionRefs = new Map<T, HTMLElement>();
    createEffect(() => {
        const option = flatOptions()[highlightIndex()];
        if (option) optionRefs.get(option.value)?.scrollIntoView({ block: 'nearest' });
    });

    const selectValue = (value: T | undefined) => {
        selectedFromList = true;
        props.onChange?.(value);
        setQuery(undefined);
        popup?.destroy();
    };

    const openPopup = () => {
        if (popup || !inputRef || props.disabled) return;
        popup = createPopup({
            ghost: true,
            interactive: true,
            anchor: { element: inputRef, position: PopupPosition.Bottom | PopupPosition.Left, size: PopupSize.Width },
            autoPosition: true,
            maxSize: { height: 250 },
            render: () => (
                <div class={classes().popup}>
                    <Show when={props.clearable}>
                        <ButtonComponent
                            label={'— None —'}
                            appearance={'flat'}
                            class={classes().option}
                            onMouseDown={event => event.preventDefault()}
                            onClick={() => selectValue(undefined)}
                        />
                    </Show>
                    <For each={groups()}>
                        {group => (
                            <>
                                <Show when={group.group}>
                                    <div class={classes().groupLabel}>{group.group}</div>
                                </Show>
                                <For each={group.options}>
                                    {(option, index) => (
                                        <ButtonComponent
                                            ref={el => { if (el) optionRefs.set(option.value, el); }}
                                            label={option.label}
                                            appearance={'flat'}
                                            class={classes().option}
                                            selected={option.value === props.value || index() === highlightIndex()}
                                            onMouseEnter={() => setHighlightIndex(index())}
                                            onMouseDown={event => event.preventDefault()}
                                            onClick={() => selectValue(option.value)}
                                        />
                                    )}
                                </For>
                            </>
                        )}
                    </For>
                </div>
            ),
            onDestroy: () => { popup = undefined; }
        });
    };

    onCleanup(() => popup?.destroy());

    return (
        <div class={classes().container}>
            <input
                ref={ref => {
                    inputRef = ref;
                    if (props.autoFocus) requestAnimationFrame(() => ref?.focus());
                }}
                class={Classes().input}
                type={'text'}
                placeholder={props.placeholder}
                value={displayValue()}
                disabled={props.disabled}
                onFocus={() => {
                    selectedFromList = false;
                    openPopup();
                }}
                onClick={() => openPopup()}
                onInput={event => {
                    selectedFromList = false;
                    openPopup();
                    setQuery(event.currentTarget.value);
                    if (props.acceptText) props.onChange?.(event.currentTarget.value as T);
                }}
                onKeyDown={event => {
                    if (event.key === 'ArrowDown') {
                        event.preventDefault();
                        if (!popup) { openPopup(); return; }
                        setHighlightIndex(index => Math.min(index + 1, flatOptions().length - 1));
                    } else if (event.key === 'ArrowUp') {
                        event.preventDefault();
                        if (!popup) { openPopup(); return; }
                        setHighlightIndex(index => Math.max(index - 1, 0));
                    } else if (event.key === 'Enter' || (event.key === ' ' && !props.acceptText)) {
                        const option = flatOptions()[highlightIndex()];
                        if (!popup || !option) return;
                        event.preventDefault();
                        selectValue(option.value);
                    }
                }}
                onBlur={() => {
                    popup?.destroy();
                    if (!props.acceptText && !selectedFromList) setQuery(undefined);
                }}
            />
            <Show when={!props.acceptText}>
                <Icon name={'chevron-down'} class={classes().chevron} />
            </Show>
        </div>
    );
}
