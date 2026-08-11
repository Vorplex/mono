import { createStyle, defineComponent } from '@vorplex/solid';
import { type JSXElement } from 'solid-js';
import { Theme } from '../consts/theme';

const classes = createStyle(() => ({
    container: {
        position: 'fixed',
        left: '0px',
        top: '0px',
        width: '100vw',
        height: '100vh',
        display: 'grid',
        justifyContent: 'center',
        alignContent: 'center',
        background: Theme().backdrop
    },
    form: {
        display: 'grid',
        gridTemplateRows: 'max-content auto max-content',
        maxHeight: '100%',
        overflow: 'hidden',
        borderRadius: '5px',
        boxShadow: `0px 0px 5px ${Theme().shadow}`
    },
    header: {
        padding: '10px',
        fontSize: '16px',
        fontWeight: 'bold',
        background: `linear-gradient(to bottom, ${Theme().primary.color}, ${Theme().background.color})`,
        color: Theme().primary.text,
        borderBottom: `1px solid ${Theme().outline.primary}`
    },
    body: {
        display: 'grid',
        overflow: 'hidden',
        gap: '5px',
        padding: '10px',
        background: Theme().background.color,
        color: Theme().background.text,
    },
    footer: {
        display: 'grid',
        justifyContent: 'end',
        gridAutoFlow: 'column',
        gap: '5px',
        padding: '10px',
        overflow: 'hidden',
        background: `linear-gradient(to top, ${Theme().secondary.color}, ${Theme().background.color})`,
        color: Theme().secondary.text,
        borderTop: `1px solid ${Theme().outline.primary}`
    },
}));

export type ModalComponentProps = {
    header?: JSXElement;
    body?: JSXElement | (() => JSXElement);
    footer?: JSXElement;
    backdropDismissal?: boolean;
    onDismiss?: () => void;
};

export const ModalComponent = defineComponent((props: ModalComponentProps) => {
    return (
        <div
            class={classes().container}
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && props.backdropDismissal) props.onDismiss?.();
            }}
        >
            <div class={classes().form}>
                <div class={classes().header}>{props.header}</div>
                <div class={classes().body}>{props.body as JSXElement}</div>
                <div class={classes().footer}>{props.footer}</div>
            </div>
        </div>
    );
});
