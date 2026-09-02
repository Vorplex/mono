import { createStyle, PopupPosition, PopupSize } from '@vorplex/solid';
import { classNames } from '@vorplex/web';
import { Show } from 'solid-js';
import { Classes, Theme } from '../../../consts/theme';
import { Icon } from '../../icon.component';

export interface TextFormInput {
    disabled?: boolean;
    autoFocus?: boolean;
    masked?: boolean;
    placeholder?: string;
    value?: string;
    flat?: boolean;
    nullable?: boolean;
    onChange?: (value: string) => void;
    onChanged?: (value: string) => void;
}

const classes = createStyle(() => ({
    container: {
        display: 'grid',
        gridAutoFlow: 'column',
        gridTemplateColumns: 'auto',
        gridAutoColumns: 'max-content',
        alignItems: 'center',
        gap: '5px'
    },
    input: {
        minWidth: '0px',
        border: 'none',
        background: 'inherit',
        color: 'inherit',
        font: 'inherit',
        padding: '0px',
        outline: 'none',
    },
    chevron: {
        display: 'inline-flex',
        cursor: 'pointer',
        color: Theme().input.placeholder,
        '&:hover': {
            color: Theme().input.text,
        }
    }
}));

export function TextFormInputComponent(props: TextFormInput) {
    const isNull = () => props.nullable && props.value === null;
    const isUndefined = () => props.nullable && props.value === undefined;
    let containerRef: HTMLDivElement;
    return (
        <div
            ref={ref => containerRef = ref}
            class={classNames(Classes().input, classes().container, { flat: props.flat, disabled: props.disabled })}
        >
            <input
                ref={ref => props.autoFocus && requestAnimationFrame(() => ref?.focus())}
                class={classes().input}
                type={props.masked ? 'password' : 'text'}
                placeholder={isNull() ? 'null' : isUndefined() ? 'undefined' : props.placeholder}
                value={isNull() || isUndefined() ? '' : props.value ?? ''}
                disabled={props.disabled}
                onInput={event => props.onChange?.(event.currentTarget.value)}
                onChange={event => props.onChanged?.(event.currentTarget.value)}
            />
            <Show when={props.nullable}>
                <div
                    class={classes().chevron}
                    use:ContextMenuDirective={{
                        action: 'click',
                        anchor: {
                            element: () => containerRef,
                            position: PopupPosition.Bottom | PopupPosition.Right,
                            size: PopupSize.Width
                        },
                        items: [
                            { icon: 'circle-slash', text: 'Null', onClick: () => props.onChange?.(null as unknown as string) },
                            { icon: 'circle-off', text: 'Undefined', onClick: () => props.onChange?.(undefined as unknown as string) },
                        ]
                    }}
                >
                    <Icon name={'chevron-down'} />
                </div>
            </Show>
        </div>
    );
}
