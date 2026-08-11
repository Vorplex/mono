import { createStyle } from '@vorplex/solid';
import { classNames } from '@vorplex/web';
import { For, JSX, Show } from 'solid-js';
import { Theme } from '../consts/theme';
import { TooltipDirectiveProps } from '../directives/tooltip.directive';
import { Icon } from './icon.component';
import { InfoIconComponent } from './info-icon.component';

export interface RadioOption<T> {
    value: T;
    label?: string;
    icon?: Icon;
    infoIcon?: 'info' | 'error',
    tooltip?: TooltipDirectiveProps;
}

export interface RadioButtonProps<T> {
    options: RadioOption<T>[];
    value?: T;
    onChange?: (value: T) => void;
    disabled?: boolean;
    class?: string;
}

const classes = createStyle(() => ({
    container: {
        display: 'inline-flex',
        borderRadius: '5px',
        border: `1px solid ${Theme().outline.primary}`,
        background: Theme().input.color,
        color: Theme().input.text,
        '&.disabled': {
            pointerEvents: 'none',
            background: Theme().disabled.color,
            color: Theme().disabled.text
        },
    },
    option: {
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '5px 10px',
        border: `1px solid transparent`,
        background: 'inherit',
        color: 'inherit',
        '&:first-child': { borderRadius: '5px 0 0 5px' },
        '&:last-child': { borderRadius: '0 5px 5px 0' },
        '&:focus-within, &:hover': {
            cursor: 'pointer',
            boxShadow: Theme().hoverShadow,
        },
        '&.selected': {
            border: `1px solid ${Theme().info.outline}`,
            background: Theme().info.color,
            color: Theme().info.text
        }
    },
}));

export function RadioButtonComponent<T>(props: RadioButtonProps<T>): JSX.Element {
    return (
        <div class={classNames(classes().container, props.class, { disabled: props.disabled })}>
            <For each={props.options}>
                {(option) => (
                    <button
                        use:TooltipDirective={option.tooltip}
                        class={classNames(classes().option, { selected: option.value === props.value })}
                        onClick={() => !props.disabled && props.onChange?.(option.value)}
                    >
                        <Show when={option.icon}>
                            <Icon name={option.icon} />
                        </Show>
                        <Show when={option.label}>
                            <span>{option.label}</span>
                        </Show>
                        <InfoIconComponent
                            hidden={!option.infoIcon}
                            type={option.infoIcon}
                        />
                    </button>
                )}
            </For>
        </div>
    );
}
