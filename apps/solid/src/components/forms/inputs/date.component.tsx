import { createStyle } from '@vorplex/solid';
import { classNames } from '@vorplex/web';
import { Show } from 'solid-js/web';
import { Classes } from '../../../consts/theme';
import { ButtonComponent } from '../../button.component';

export interface DateFormInput {
    disabled?: boolean;
    autoFocus?: boolean;
    value?: Date;
    onChange?: (value: Date) => void;
}

const classes = createStyle(() => ({
    inputContainer: {
        display: 'flex'
    },
    input: {
        width: '130px',
        padding: '3.5px 10px',
        borderRadius: '5px 0px 0px 5px',
        colorScheme: 'dark',
        '&:last-child': {
            borderRadius: '5px'
        },
    },
    clear: {
        borderRadius: '0px 5px 5px 0px',
    },
}));

export function DateFormInputComponent(props: DateFormInput) {
    return (
        <div class={classes().inputContainer}>
            <input
                ref={ref => props.autoFocus && requestAnimationFrame(() => ref?.focus())}
                class={classNames(classes().input, Classes().input)}
                type={'date'}
                value={String(props.value ? `${props.value.getFullYear()}-${String(props.value.getMonth() + 1).padStart(2, '0')}-${String(props.value.getDate()).padStart(2, '0')}` : '')}
                disabled={props.disabled}
                onChange={(event) => props.onChange?.(new Date(event.currentTarget.value))}
            />
            <Show when={!props.disabled}>
                <ButtonComponent
                    class={classes().clear}
                    icon={'x'}
                    onClick={() => props.onChange?.(null)}
                />
            </Show>
        </div>
    );
}
