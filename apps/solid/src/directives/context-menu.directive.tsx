import { createPopup, createStyle, defineComponent, PopupPosition } from '@vorplex/solid';
import { $Element } from '@vorplex/web';
import { Accessor, createEffect, For, onCleanup, Show } from 'solid-js';
import { ButtonComponent } from '../components/button.component';
import { Icon } from '../components/icon.component';
import { Theme } from '../consts/theme';

export interface ContextMenuItem {
    icon: Icon;
    text: string;
    hidden?: boolean;
    onClick: () => void;
}

const classes = createStyle(() => ({
    container: {
        display: 'grid',
        gridAutoRows: 'max-content',
        boxShadow: `0px 0px 5px ${Theme().shadow}`,
        padding: '5px',
        background: Theme().primary.color,
        color: Theme().primary.text,
        border: `1px solid ${Theme().outline.primary}`,
        borderRadius: '5px',
        minWidth: '200px',
    },
}));

export const ContextMenuComponent = defineComponent((props: { items: ContextMenuItem[], onItemClicked?: (item: ContextMenuItem) => void }) => {
    return (
        <div class={classes().container}>
            <For each={props.items}>
                {(item) => (
                    <Show when={!item.hidden}>
                        <ButtonComponent
                            appearance={'flat'}
                            style={{ 'justify-content': 'left' }}
                            icon={item.icon}
                            label={item.text}
                            onClick={() => {
                                props.onItemClicked?.(item);
                                item.onClick();
                            }}
                        />
                    </Show>
                )}
            </For>
        </div>
    );
});

export interface ContextMenuDirectiveProps {
    position?: PopupPosition;
    items: ContextMenuItem[];
    action?: 'contextmenu' | 'click';
}

export function ContextMenuDirective(element: HTMLElement, props: Accessor<ContextMenuDirectiveProps>) {
    createEffect(() => {
        const dispose = $Element.addEventListener(element, props().action ?? 'contextmenu', event => {
            event.preventDefault();
            event.stopPropagation();
            if (props().items.length) {
                element.setAttribute('data-context-menu-open', 'true');
                createPopup({
                    anchor: props().position ? { element, position: props().position } : undefined,
                    location: !props().position ? { x: event.clientX, y: event.clientY } : undefined,
                    autoTransform: true,
                    render: (portal) => <ContextMenuComponent items={props().items} onItemClicked={() => portal.destroy()} />,
                    onDestroy: () => element.removeAttribute('data-context-menu-open')
                });
            }
        });
        onCleanup(() => dispose());
    });
}