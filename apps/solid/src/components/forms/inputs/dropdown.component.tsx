import { $String } from '@vorplex/core';
import { createStyle, ForIn } from '@vorplex/solid';
import { classNames } from '@vorplex/web';
import { Show } from 'solid-js';
import { Classes, Theme } from '../../../consts/theme';

export interface DropdownFormInput<T extends string = string> {
    disabled?: boolean;
    autoFocus?: boolean;
    value?: string;
    options: Record<T, string>;
    placeholder?: string;
    clearable?: boolean;
    onChange?: (value: T | undefined) => void;
}

const classes = createStyle(() => ({
    select: {
        padding: '3.5px 5px'
    }
}));

export function DropdownFormInputComponent<T extends string = string>(props: DropdownFormInput<T>) {
    return (
        <select
            ref={ref => props.autoFocus && requestAnimationFrame(() => ref?.focus())}
            class={classNames(classes().select, Classes().input)}
            style={{ color: $String.isNullOrEmpty(props.value) && props.placeholder ? Theme().input.placeholder : Theme().input.text }}
            value={props.value ?? ''}
            disabled={props.disabled}
            onChange={(event) => {
                const value = event.currentTarget.value;
                props.onChange?.(value === '' ? undefined : value as T);
                event.currentTarget.value = props.value ?? '';
            }}
        >
            <option
                value={''}
                selected={props.value == null}
                disabled={true}
                hidden={true}
                innerText={props.placeholder}
            />
            <Show when={props.clearable}>
                <option
                    value={''}
                    selected={props.value == null}
                    innerText={'— None —'}
                />
            </Show>
            <ForIn each={props.options}>
                {(text, key) => (
                    <option
                        value={key}
                        selected={key === props.value}
                        innerText={text()}
                        style={{ color: Theme().input.text }}
                    />
                )}
            </ForIn>
        </select>
    );
}
