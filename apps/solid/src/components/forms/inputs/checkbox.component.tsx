import { defineComponent } from '@vorplex/solid';
import { Classes } from '../../../consts/theme';

export interface CheckboxFormInput {
    disabled?: boolean;
    value?: boolean;
    nullable?: boolean;
    onChange?: (value: boolean) => void;
}

export const CheckboxFormInputComponent = defineComponent((props: CheckboxFormInput) => {
    return (
        <input
            type='checkbox'
            class={Classes().toggle}
            {...{ indeterminate: props.nullable && props.value == null }}
            checked={props.value}
            disabled={props.disabled}
            onChange={event => {
                const value = props.nullable ? props.value === true ? null : props.value === false ? true : false : event.currentTarget.checked;
                props.onChange?.(value);
            }}
        />
    );
});
