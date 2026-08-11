import { $Array } from '@vorplex/core';
import { createStyle, defineComponent, ForIn } from '@vorplex/solid';
import { classNames } from '@vorplex/web';
import { For, Show } from 'solid-js';
import { Classes, Theme } from '../../../consts/theme';
import { Icon } from '../../icon.component';


export interface TagsFormInput {
    disabled?: boolean;
    options: Record<string, string>;
    value?: string[];
    onChange?: (value: string[]) => void;
}

const classes = createStyle(() => ({
    container: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '5px',
        alignItems: 'stretch',
        overflow: 'auto',
        minHeight: '3.1rem',
        '& select': {
            fieldSizing: 'content',
            width: '18px',
            minHeight: '2.1rem',
            height: 'auto',
            background: Theme().background.color,
            color: Theme().background.text,
        },
    },
    tag: {
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        borderRadius: '10px',
        overflow: 'hidden',
        background: Theme().background.color,
        color: Theme().background.text,
        '& > :first-child:last-child': {
            padding: '5px 10px',
        },
        '& > :not(:last-child):first-child': {
            padding: '5px 5px 5px 10px'
        },
        '& > :not(:first-child):last-child': {
            padding: '5px 10px 5px 5px',
            '&:hover': {
                boxShadow: Theme().hoverShadow,
            }
        },
        '&:hover': {
            boxShadow: Theme().hoverShadow,
        }
    },
    textfield: {
        minWidth: '20px',
        alignSelf: 'center',
        flexGrow: '1'
    }
}));

export const TagsFormInputComponent = defineComponent((props: TagsFormInput) => {
    return (
        <div class={classNames(classes().container, Classes().input)} style={{ 'grid-template-columns': (props.value ?? []).map(key => 'max-content').concat(props.options ? 'max-content auto' : 'auto').join(' ') }} >
            <For each={props.value ?? []}>
                {value => (
                    <div class={classes().tag}>
                        <span innerText={props.options ? props.options[value] : value} />
                        <Show when={!props.disabled}>
                            <Icon
                                onClick={() => props.onChange?.($Array.remove(props.value, value))}
                                name={'x'} />
                        </Show>
                    </div>
                )}
            </For>
            <Show when={!props.disabled}>
                <Show when={props.options && props.value?.length !== Object.keys(props.options).length}>
                    <select class={classes().tag} onChange={event => {
                        if (event.currentTarget.value != null && !props.value?.includes(event.currentTarget.value)) {
                            props.onChange?.((props.value ?? []).concat(event.currentTarget.value));
                        }
                        event.currentTarget.value = null;
                    }}>
                        <option
                            disabled
                            hidden
                            selected
                            value={null}
                            innerText={' '}
                        />
                        <ForIn each={props.options}>
                            {(value, key) => (
                                <Show when={!props.value?.includes(key)}>
                                    <option value={key} innerText={value()} />
                                </Show>
                            )}
                        </ForIn>
                    </select>
                </Show>
                <Show when={!props.options}>
                    <div
                        class={classes().textfield}
                        contentEditable={true}
                        onKeyDown={event => {
                            if (event.code === 'Enter') {
                                if (event.currentTarget.innerText !== '' && (!props.options || event.currentTarget.innerText in props.options) && !props.value?.includes(event.currentTarget.innerText)) {
                                    props.onChange?.((props.value ?? []).concat(event.currentTarget.innerText));
                                }
                                event.currentTarget.innerText = '';
                                event.preventDefault();
                                event.stopPropagation();
                            } else if (event.code === 'Backspace' && event.currentTarget.innerText === '' && props.value?.length) {
                                props.onChange?.(props.value.slice(0, props.value.length - 1));
                            }
                        }}
                    />
                </Show>
            </Show>
        </div>
    );
});
