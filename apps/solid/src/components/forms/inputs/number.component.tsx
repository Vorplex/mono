import { Classes } from '../../../consts/theme';

export interface NumberFormInput {
    disabled?: boolean;
    autoFocus?: boolean;
    placeholder?: string;
    value?: number;
    onChange?: (value: number) => void;
}

export function NumberFormInputComponent(props: NumberFormInput) {
    return (
        <input
            ref={ref => props.autoFocus && requestAnimationFrame(() => ref?.focus())}
            class={Classes().input}
            type={'number'}
            placeholder={props.placeholder}
            value={props.value ?? ''}
            disabled={props.disabled}
            onInput={(event) => props.onChange?.(Number(event.currentTarget.value))}
        />
    );
}
