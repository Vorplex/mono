import { defineComponent } from '@vorplex/solid';
import { Classes } from '../../../consts/theme';

export interface TextAreaFormInput {
    disabled?: boolean;
    autoFocus?: boolean;
    placeholder?: string;
    value?: string;
    onChange?: (value: string) => void;
}

export const TextAreaFormInputComponent = defineComponent((props: TextAreaFormInput) => {
    return (
        <textarea
            ref={ref => props.autoFocus && requestAnimationFrame(() => ref?.focus())}
            class={Classes().input}
            style={{ resize: 'vertical' }}
            rows={3}
            placeholder={props.placeholder}
            value={props.value ?? ''}
            disabled={props.disabled}
            onInput={(event) => props.onChange?.(event.currentTarget.value)}
        />
    );
});
