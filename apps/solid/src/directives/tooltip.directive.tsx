import { createPopup, createStyle, defineComponent, Portal } from '@vorplex/solid';
import { $Element, classNames } from '@vorplex/web';
import { onCleanup, type Accessor } from 'solid-js';
import { Theme } from '../consts/theme';

const classes = createStyle(() => ({
    tooltip: {
        position: 'relative',
        borderRadius: '5px',
        padding: '5px 10px',
        background: Theme().info.color,
        color: Theme().info.text,
        boxShadow: `0px 0px 5px ${Theme().shadow}`,
        maxWidth: '33vw',
        '&::before': {
            position: 'absolute',
            left: '0%',
            top: '50%',
            transform: 'translate(-50%, -50%) rotate(45deg)',
            content: `''`,
            width: '5px',
            height: '5px',
            background: Theme().info.color,
            color: Theme().info.text,
        },
        '&.top': {
            transform: 'translate(-50%, -100%)',
            '&::before': {
                left: '50%',
                top: '100%',
            },
        },
        '&.right': {
            transform: 'translate(0, -50%)',
            '&::before': {
                left: '0%',
                top: '50%',
            },
        },
        '&.bottom': {
            transform: 'translate(-50%, 0)',
            '&::before': {
                left: '50%',
                top: '0%',
            },
        },
        '&.left': {
            transform: 'translate(-100%, -50%)',
            '&::before': {
                left: '100%',
                top: '50%',
            },
        },
    },
}));

export const TooltipPosition = {
    Top: 'top',
    Right: 'right',
    Bottom: 'bottom',
    Left: 'left'
} as const;
export type TooltipPosition = typeof TooltipPosition[keyof typeof TooltipPosition];

export const TooltipComponent = defineComponent((props: { tip: string, position: TooltipPosition }) => {
    return <div class={classNames(classes().tooltip, props.position)}>{props.tip}</div>;
});

export interface TooltipDirectiveProps {
    tip: string;
    position: TooltipPosition;
}

export function TooltipDirective(element: HTMLElement, props: Accessor<TooltipDirectiveProps>) {
    let tooltipPopup: Portal;
    const disposes = [
        $Element.addEventListener(element, 'mouseenter', () => {
            if (!props()) return;
            tooltipPopup?.destroy();
            tooltipPopup = createPopup({
                ghost: true,
                location: $Element.getRelativePoint(element, props().position, 10),
                render: () => {
                    return <TooltipComponent tip={props().tip} position={props().position} />;
                },
            });
        }),
        $Element.addEventListener(element, 'mouseleave', () => tooltipPopup?.destroy()),
        $Element.addEventListener(document, 'mousedown', () => tooltipPopup?.destroy(), { capture: true }),
    ];
    onCleanup(() => {
        disposes.forEach(dispose => dispose());
        tooltipPopup?.destroy();
    });
}
