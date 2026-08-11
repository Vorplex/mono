import { defineComponent } from '@vorplex/solid';
import { Classes } from '../../../consts/theme';

export interface TextFormInput {
    disabled?: boolean;
    autoFocus?: boolean;
    masked?: boolean;
    placeholder?: string;
    value?: string;
    onChange?: (value: string) => void;
    onChanged?: (value: string) => void;
}

export const TextFormInputComponent = defineComponent((props: TextFormInput) => {
    return (
        <input
            ref={ref => props.autoFocus && requestAnimationFrame(() => ref?.focus())}
            class={Classes().input}
            type={props.masked ? 'password' : 'text'}
            placeholder={props.placeholder}
            value={props.value ?? ''}
            disabled={props.disabled}
            onInput={(event) => props.onChange?.(event.currentTarget.value)}
            onChange={event => props.onChanged?.(event.currentTarget.value)}
        />
    );
});

