import { type TsonDefinition } from '@vorplex/core';
import { createStyle } from '@vorplex/solid';
import { ButtonComponent } from '../../../../../components/button.component';
import { Theme } from '../../../../../consts/theme';
import { showExpressionModal } from './show-expression-modal';

const classes = createStyle(() => ({
    container: {
        display: 'grid',
        gridTemplateColumns: 'auto max-content',
        alignItems: 'stretch',
        border: `1px solid ${Theme().outline.primary}`,
        borderRadius: '5px',
        overflow: 'hidden'
    },
    input: {
        width: '100%',
        fontFamily: 'inherit',
        fontSize: '1rem',
        border: '1px solid transparent',
        borderRadius: '5px 0px 0px 5px',
        padding: '5px 10px',
        background: Theme().input.color,
        color: Theme().input.text,
        '&:focus-within': {
            border: `1px solid ${Theme().info.outline}`,
            background: Theme().info.color,
            color: Theme().info.text,
        },
        '&::placeholder': {
            color: Theme().input.placeholder
        },
        '&:disabled': {
            pointerEvents: 'none',
            background: Theme().disabled.color,
            color: Theme().disabled.text
        },
    },
    button: {
        borderRadius: '0px',
        borderLeft: `1px solid ${Theme().outline.primary}`,
    }
}));

export function ExpressionInputComponent(props: { value: string, locals: Record<string, TsonDefinition>, accepts: TsonDefinition, onChange?: (value: string) => void }) {
    const openExpressionModal = async () => {
        const result = await showExpressionModal({ value: props.value, locals: props.locals, accepts: props.accepts });
        if (result !== undefined) props.onChange?.(result);
    };
    return (
        <div class={classes().container}>
            <input
                class={classes().input}
                value={props.value}
                onInput={event => props.onChange(event.currentTarget.value)}
            />
            <ButtonComponent
                class={classes().button}
                appearance='flat'
                label='ƒ'
                onClick={() => openExpressionModal()}
            />
        </div>
    );
}
