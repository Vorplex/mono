import { createStyle } from '@vorplex/solid';
import { createSignal } from 'solid-js';

export const DarkTheme = {
    primary: {
        color: '#1f2329',
        text: '#eef1f4',
        subText: '#9ba4ad',
    },
    secondary: {
        color: '#181b1e',
        text: '#eef1f4',
        subText: '#9ba4ad',
    },
    background: {
        color: '#111315',
        text: '#eef1f4',
        subText: '#9ba4ad',
    },
    disabled: {
        color: '#272c2f',
        outline: '#373d42',
        text: '#555e66'
    },
    input: {
        color: '#202428',
        placeholder: '#555e66',
        text: 'white',
        subText: '#6b7480',
    },
    accent: {
        color: '#7d8cff',
        text: '#ffffff',
    },
    info: {
        color: '#2f354b',
        outline: '#818fe4',
        text: '#dfe3ff'
    },
    success: {
        color: '#21322c',
        outline: '#51a97c',
        text: '#d7ffe8'
    },
    warning: {
        color: '#30302e',
        outline: '#918168',
        text: '#f6c177'
    },
    error: {
        color: '#322527',
        outline: '#b65a5b',
        text: '#ffd7d6'
    },
    outline: {
        primary: '#31373e',
        secondary: '#1a1c1e'
    },
    shadow: '#000000',
    backdrop: '#000000cc',
    hoverShadow: 'inset 0 0 0 9999px rgba(125, 140, 255, 0.12)',
};

export const LightTheme = {
    primary: {
        color: '#dde1e6',
        text: '#1a1d21',
        subText: '#6b7480',
    },
    secondary: {
        color: '#e8ebef',
        text: '#1a1d21',
        subText: '#6b7480',
    },
    background: {
        color: '#f3f5f8',
        text: '#1a1d21',
        subText: '#6b7480',
    },
    disabled: {
        color: '#e8ebef',
        outline: '#ccd0d6',
        text: '#9ba4ad'
    },
    input: {
        color: '#e4e9ee',
        placeholder: '#9ba4ad',
        text: '#1a1d21',
        subText: '#9ba4ad',
    },
    focus: {
        color: '#d4dce8',
        text: '#1a1d21',
    },
    accent: {
        color: '#7d8cff',
        text: '#ffffff',
    },
    info: {
        color: '#c8d4ff',
        outline: '#7786e0',
        text: '#1a2880'
    },
    success: {
        color: '#a8e8c4',
        outline: '#01c358',
        text: '#0d4028'
    },
    warning: {
        color: '#edaa78',
        outline: '#ff8c4e',
        text: '#5a2000'
    },
    error: {
        color: '#ffaaaa',
        outline: '#d33636',
        text: '#620e0e'
    },
    outline: {
        primary: '#bec6d0',
        secondary: '#d4dae0'
    },
    shadow: '#00000015',
    backdrop: '#00000060',
    hoverShadow: 'inset 0 0 0 9999px rgba(80, 96, 200, 0.10)',
};

export const [Theme, setTheme] = createSignal(DarkTheme);

export const Classes = createStyle(() => ({
    input: {
        fontFamily: 'inherit',
        fontSize: '1rem',
        borderRadius: '5px',
        border: `1px solid ${Theme().outline.primary}`,
        padding: '5px 10px',
        width: '100%',
        minWidth: '0px',
        background: Theme().input.color,
        color: Theme().input.text,
        '&.flat': {
            border: '1px solid transparent',
            background: 'inherit',
            color: 'inherit',
            '&:not(:focus-within):hover': {
                border: `1px dashed ${Theme().outline.primary}`
            }
        },
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
    toggle: {
        appearance: 'none',
        width: '44px',
        minWidth: '44px',
        height: '28px',
        borderRadius: '999px',
        border: `1px solid ${Theme().outline.primary}`,
        background: 'transparent',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.2s ease',
        '&:hover': {
            boxShadow: Theme().hoverShadow
        },
        '&:focus-within': {
            border: `1px solid ${Theme().info.outline}`
        },
        '&::before': {
            content: '""',
            position: 'absolute',
            width: '21px',
            height: '21px',
            top: '2px',
            left: '2px',
            borderRadius: '50%',
            background: Theme().outline.primary,
            transition: `
                left 0.2s ease,
                width 0.2s ease,
                height 0.2s ease,
                top 0.2s ease,
                background 0.2s ease
            `,
        },
        '&:checked': {
            background: Theme().input.color,
            '&::before': {
                left: '19px',
                background: Theme().info.text
            }
        },
        '&:indeterminate::before': {
            left: '16px',
            width: '10px',
            height: '10px',
            top: '7.5px',
        },
        '&:disabled': {
            pointerEvents: 'none',
            background: Theme().disabled.color,
            color: Theme().disabled.text
        },
    },
    select: {
        borderRadius: '5px',
        border: `1px solid ${Theme().outline.primary}`,
        padding: '5px',
        background: Theme().input.color,
        color: Theme().input.text,
        '&.flat': {
            border: '1px solid transparent',
            background: 'inherit',
            color: 'inherit',
            '&:not(:focus-within):hover': {
                border: `1px dashed ${Theme().outline.primary}`
            }
        },
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
    }
}));


document.addEventListener('keyup', event => {
    if (event.ctrlKey && event.code === 'Home') {
        event.stopPropagation();
        event.preventDefault();
        setTheme(Theme() === DarkTheme ? LightTheme : DarkTheme);
    }
}, { capture: true });