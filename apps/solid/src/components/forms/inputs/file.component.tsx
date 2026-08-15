import { createStyle } from '@vorplex/solid';
import { classNames } from '@vorplex/web';
import { createSignal } from 'solid-js';
import { Classes, Theme } from '../../../consts/theme';
import { Icon } from '../../icon.component';

export interface FileFormInput {
    disabled?: boolean;
    autoFocus?: boolean;
    multiple?: boolean;
    value?: File[];
    onChange?: (value: File[]) => void;
}

const classes = createStyle(() => ({
    container: {
        display: 'grid',
        gridTemplateColumns: 'auto max-content',
        overflow: 'hidden'
    },
    text: {
        borderRadius: '5px 0px 0px 5px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    upload: {
        padding: '5px',
        borderRadius: '0px 5px 5px 0px',
        border: `1px solid ${Theme().outline.primary}`,
        background: Theme().input.color,
        color: Theme().input.text,
        '&:hover': {
            cursor: 'pointer',
            boxShadow: Theme().hoverShadow,
        },
        '&.disabled': {
            pointerEvents: 'none',
            background: Theme().disabled.color,
            color: Theme().disabled.text,
        },
    },
    input: {
        display: 'none',
    },
}));

export function FileFormInputComponent(props: FileFormInput) {
    const [names, setNames] = createSignal<string[]>([]);
    let inputRef: HTMLInputElement;

    return (
        <div class={classes().container}>
            <input
                ref={ref => {
                    inputRef = ref;
                    if (props.autoFocus) requestAnimationFrame(() => ref?.focus());
                }}
                class={classes().input}
                type={'file'}
                multiple={props.multiple}
                onChange={(event) => {
                    const files = Array.from(event.currentTarget.files ?? []);
                    setNames(files.map(f => f.name));
                    props.onChange?.(files);
                }}
            />
            <span
                class={classNames(classes().text, Classes().input, { placeholder: !names().length, disabled: props.disabled })}
                innerText={names().length ? names().join(', ') : 'No file chosen'}
            />
            <Icon
                class={classNames(classes().upload, { disabled: props.disabled })}
                name={'file-up'}
                onClick={() => inputRef?.click()}
            />
        </div>
    );
}
