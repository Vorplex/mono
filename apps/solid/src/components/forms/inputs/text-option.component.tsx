import { createPopup, createStyle, PopupPosition, PopupSize, type Portal } from '@vorplex/solid';
import { createMemo, For, onCleanup } from 'solid-js';
import { Classes, Theme } from '../../../consts/theme';
import { ButtonComponent } from '../../button.component';

export interface TextOptionFormInput {
    disabled?: boolean;
    autoFocus?: boolean;
    placeholder?: string;
    value?: string;
    options: string[];
    onChange?: (value: string) => void;
    onChanged?: (value: string) => void;
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
        maxHeight: '250px',
        height: '100%',
        overflow: 'auto'
    }
}));

export function TextOptionFormInputComponent(props: TextOptionFormInput) {
    let inputRef: HTMLInputElement | undefined;
    let popup: Portal | undefined;

    const filtered = createMemo(() => {
        const query = (props.value ?? '').toLowerCase();
        return props.options.filter(option => option.toLowerCase().includes(query));
    });

    const openPopup = () => {
        if (popup || !inputRef || props.disabled) return;
        popup = createPopup({
            ghost: true,
            interactive: true,
            anchor: { element: inputRef, position: PopupPosition.Bottom | PopupPosition.Left, size: PopupSize.Width },
            autoPosition: true,
            render: () => (
                <div class={classes().container}>
                    <For each={filtered()}>
                        {option => (
                            <ButtonComponent
                                label={option}
                                appearance={'flat'}
                                style={{ 'justify-content': 'left' }}
                                onMouseDown={event => event.preventDefault()}
                                onClick={() => {
                                    props.onChange?.(option);
                                    props.onChanged?.(option);
                                    popup?.destroy();
                                }}
                            />
                        )}
                    </For>
                </div>
            ),
            onDestroy: () => { popup = undefined; }
        });
    };

    onCleanup(() => popup?.destroy());

    return (
        <input
            ref={ref => {
                inputRef = ref;
                if (props.autoFocus) requestAnimationFrame(() => ref?.focus());
            }}
            class={Classes().input}
            type={'text'}
            placeholder={props.placeholder}
            value={props.value ?? ''}
            disabled={props.disabled}
            onFocus={() => openPopup()}
            onInput={(event) => {
                openPopup();
                props.onChange?.(event.currentTarget.value);
            }}
            onChange={event => props.onChanged?.(event.currentTarget.value)}
            onBlur={() => popup?.destroy()}
        />
    );
}
