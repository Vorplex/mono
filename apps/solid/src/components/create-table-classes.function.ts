import { createStyle, StyleClasses } from '@vorplex/solid';
import { Theme } from '../consts/theme';

export type TableClasses = 'table' | 'header' | 'body' | 'row' | 'cell';

export function createTableClasses(props: () => { columns: string; classes?: StyleClasses<Partial<Record<TableClasses, string>>>; }) {
    return createStyle(() => ({
        table: {
            display: 'grid',
            gridTemplateColumns: props().columns,
            gridTemplateRows: 'max-content 1fr',
            border: `1px solid ${Theme().outline.primary}`,
            borderRadius: '0.5rem',
            overflow: 'hidden',
            resize: 'vertical',
            ...(props().classes?.table ?? {}),
        },
        header: {
            display: 'grid',
            gridTemplateColumns: 'subgrid',
            gridColumn: '1 / -1',
            background: Theme().secondary.color,
            color: Theme().secondary.text,
            fontWeight: 'bold',
            borderBottom: `1px solid ${Theme().outline.primary}`,
            overflowY: 'hidden',
            boxSizing: 'border-box',
        },
        body: {
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: 'subgrid',
            gridColumn: '1 / -1',
            overflowY: 'scroll',
            gridAutoRows: 'max-content',
            ...(props().classes?.body ?? {}),
        },
        row: {
            zIndex: 1,
            display: 'grid',
            gridTemplateColumns: 'subgrid',
            gridColumn: '1 / -1',
            borderBottom: `1px solid ${Theme().outline.primary}`,
            background: 'inherit',
            ...(props().classes?.row ?? {}),
        },
        cell: {
            alignContent: 'center',
            borderRight: `1px solid ${Theme().outline.primary}`,
            wordBreak: 'break-word',
            padding: '5px 10px',
            ...(props().classes?.cell ?? {}),
        },
    }));
}
