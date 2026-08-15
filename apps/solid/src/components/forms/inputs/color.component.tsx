import { createStyle } from '@vorplex/solid';
import { classNames } from '@vorplex/web';
import { Classes } from '../../../consts/theme';

export interface ColorFormInput {
    disabled?: boolean;
    autoFocus?: boolean;
    value?: string;
    onChange?: (value: string) => void;
}

const classes = createStyle(() => ({
    input: {
        cursor: 'pointer',
        width: '25px',
        padding: '2px',
    },
}));

export function ColorFormInputComponent(props: ColorFormInput) {
    return (
        <input
            ref={ref => props.autoFocus && ref?.focus()}
            class={classNames(classes().input, Classes().input)}
            type={'color'}
            value={props.value ?? ''}
            disabled={props.disabled}
            onInput={(event) => props.onChange?.(event.currentTarget.value)}
        />
    );
}
