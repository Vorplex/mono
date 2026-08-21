import { createStyle } from "@vorplex/solid";
import { JSX } from "solid-js";
import { Theme } from "../consts/theme";
import { Icon } from "./icon.component";

const classes = createStyle(() => ({
    panel: {
        display: 'grid',
        gridTemplateRows: 'max-content auto',
        overflow: 'hidden',
        background: Theme().secondary.color,
        color: Theme().secondary.text,
        border: `1px solid ${Theme().outline.primary}`,
        borderRadius: '5px',
        height: '100%'
    },
    header: {
        display: 'flex',
        gap: '5px',
        alignItems: 'center',
        padding: '5px',
        fontWeight: 'bold',
        background: Theme().primary.color,
        color: Theme().primary.text,
        borderBottom: `1px solid ${Theme().outline.primary}`
    },
}));

export function PanelComponent(props: { icon: Icon, title: string, children: JSX.Element }) {

    return (
        <div class={classes().panel}>
            <div class={classes().header}>
                <Icon name={props.icon} />
                <span>{props.title}</span>
            </div>
            {props.children}
        </div>
    );
}
