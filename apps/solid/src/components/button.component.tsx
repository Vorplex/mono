import { Awaitable } from '@vorplex/core';
import { createStyle, defineComponent } from '@vorplex/solid';
import { classNames } from '@vorplex/web';
import { createSignal, JSX, Show, splitProps } from 'solid-js';
import { Theme } from '../consts/theme';
import { TooltipDirectiveProps } from '../directives/tooltip.directive';
import { Icon } from './icon.component';
import { InfoIconComponent } from './info-icon.component';

export type ButtonAppearance = 'solid' | 'outline' | 'flat' | 'dashed';
export type ButtonIntent = 'neutral' | 'success' | 'warning' | 'danger' | 'accent';

export interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
    appearance?: ButtonAppearance,
    intent?: ButtonIntent,
    selected?: boolean,
    icon?: Icon,
    label?: string,
    infoIcon?: 'info' | 'error',
    tooltip?: TooltipDirectiveProps,
    loading?: boolean,
    readonly?: boolean,
    onClick?: (event: MouseEvent) => Awaitable<any>
}

const classes = createStyle(() => ({
    button: {
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '5px',
        fontSize: '1rem',
        borderRadius: '5px',
        border: `1px solid ${Theme().outline.primary}`,
        padding: '5px 10px',
        background: Theme().input.color,
        color: Theme().input.text,
        '&.icon': {
            padding: '5px'
        },
        '&.success': {
            border: `1px solid ${Theme().success.outline}`,
            background: Theme().success.color,
            color: Theme().success.text,
        },
        '&.warning': {
            border: `1px solid ${Theme().warning.outline}`,
            background: Theme().warning.color,
            color: Theme().warning.text,
        },
        '&.danger': {
            border: `1px solid ${Theme().error.outline}`,
            background: Theme().error.color,
            color: Theme().error.text,
        },
        '&.accent': {
            border: `1px solid ${Theme().info.outline}`,
            background: Theme().info.color,
            color: Theme().info.text,
        },
        '&.dashed': {
            border: `1px dashed ${Theme().outline.primary}`,
            background: 'inherit',
            color: 'inherit',
            '&.success': { border: `1px dashed ${Theme().success.outline}`, color: Theme().success.color },
            '&.warning': { border: `1px dashed ${Theme().warning.outline}`, color: Theme().warning.color },
            '&.danger': { border: `1px dashed ${Theme().error.outline}`, color: Theme().error.color },
            '&.accent': { border: `1px dashed ${Theme().info.outline}`, color: Theme().info.color },
        },
        '&.flat': {
            border: `1px solid transparent`,
            background: 'inherit',
            color: 'inherit',
            '&.success': { color: Theme().success.outline },
            '&.warning': { color: Theme().warning.outline },
            '&.danger': { color: Theme().error.outline },
            '&.accent': { color: Theme().info.outline },
        },
        '&.outline': {
            background: 'transparent',
            '&.success': {
                border: `1px solid ${Theme().success.color}`,
                color: Theme().success.color,
            },
            '&.warning': {
                border: `1px solid ${Theme().warning.color}`,
                color: Theme().warning.color,
            },
            '&.danger': {
                border: `1px solid ${Theme().error.color}`,
                color: Theme().error.color,
            },
            '&.accent': {
                border: `1px solid ${Theme().accent.color}`,
                color: Theme().accent.color,
            },
        },
        '&:not(.disabled):not(.loading):not(.selected):not(.readonly)': {
            '&:focus-within, &:hover, &:active': {
                cursor: 'pointer',
                boxShadow: Theme().hoverShadow,
            }
        },
        '&.selected': {
            border: `1px solid ${Theme().info.outline}`,
            background: Theme().info.color,
            color: Theme().info.text,
        },
        '&.disabled, &.loading': {
            borderColor: Theme().disabled.outline,
            background: Theme().disabled.color,
            color: Theme().disabled.text
        },
        '&.disabled, &.loading, &.readonly': {
            pointerEvents: 'none',
        }
    },
}));

export const ButtonComponent = defineComponent((props: ButtonProps) => {
    const [local, rest] = splitProps(props, [
        'appearance',
        'intent',
        'selected',
        'icon',
        'label',
        'infoIcon',
        'tooltip',
        'class',
        'disabled',
        'children',
        'loading',
        'onClick',
        'readonly'
    ]);
    const [loading, setLoading] = createSignal<boolean>();
    return (
        <button
            use:TooltipDirective={local.tooltip}
            {...rest}
            class={classNames(
                classes().button,
                local.appearance,
                local.intent,
                local.class,
                {
                    loading: local.loading || loading(),
                    disabled: local.disabled,
                    selected: local.selected,
                    readonly: local.readonly,
                    icon: local.icon && !local.label
                }
            )}
            disabled={local.disabled}
            onClick={async event => {
                setLoading(true);
                try {
                    await local.onClick?.(event);
                } finally {
                    setLoading(false);
                }
            }}
        >
            <Show when={loading() || local.loading || local.icon}>
                <Icon name={local.loading ? 'loader-circle' : local.icon} />
            </Show>
            <Show when={local.label}>
                <span innerText={local.label} />
            </Show>
            {local.children}
            <InfoIconComponent
                hidden={!local.infoIcon}
                type={local.infoIcon}
            />
        </button>
    );
});
