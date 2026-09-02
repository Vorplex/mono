import { $Tson, type TsonDefinition, type TsonObjectDefinition } from '@vorplex/core';
import { createStyle } from '@vorplex/solid';
import { createMemo, createSignal, For, Match, Show, Switch } from 'solid-js';
import { ButtonComponent } from '../../../../../components/button.component';
import { TreeViewItemFragment } from '../../../../../components/tree-view-item.component';
import { Theme } from '../../../../../consts/theme';

const classes = createStyle(() => ({
    container: {
        display: 'grid',
        gridTemplateColumns: '200px auto',
        gridTemplateRows: 'max-content auto',
        overflow: 'hidden',
        border: `1px solid ${Theme().outline.primary}`,
        borderRadius: '5px',
        height: '100%'
    },
    header: {
        gridColumn: '1 / -1',
        padding: '5px 10px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        fontFamily: 'monospace',
        borderBottom: `1px solid ${Theme().outline.primary}`,
        background: Theme().primary.color,
        color: Theme().primary.text
    },
    items: {
        display: 'grid',
        gridAutoRows: 'max-content',
        gap: '5px',
        overflow: 'auto',
        padding: '5px',
        borderRight: `1px solid ${Theme().outline.primary}`
    },
    paths: {
        display: 'grid',
        gridAutoRows: 'max-content',
        gap: '5px',
        overflow: 'auto',
        padding: '5px'
    },
    path: {
        display: 'grid',
        gridTemplateColumns: 'auto max-content',
        gap: '5px',
        justifyItems: 'left',
        overflow: 'hidden',
        width: '100%',
        '& > *:last-child': {
            color: Theme().background.subText
        }
    }
}));

export function TsonPathItemComponent(props: { name: string; definition: TsonDefinition; path?: string; selectedPath: string; selectableDefinition?: TsonDefinition; onSelect: (path: string) => void }) {

    const isSelectable = createMemo(() => {
        if (!props.definition || !props.selectableDefinition) return true;
        return $Tson.parse(props.selectableDefinition).accepts(props.definition);
    });

    return (
        <TreeViewItemFragment>
            {indent => <>
                <ButtonComponent
                    appearance={isSelectable() ? 'dashed' : 'flat'}
                    readonly={!isSelectable()}
                    selected={props.selectedPath != null && (props.path ?? '') === props.selectedPath}
                    style={{ 'padding-left': `${10 + 10 * indent}px`, 'justify-content': 'unset' }}
                    onClick={() => { if (isSelectable()) props.onSelect(props.path ?? ''); }}
                >
                    <div class={classes().path}>
                        <span>{props.name}</span>
                        <span>{props.definition == null ? 'any' : props.definition.type}</span>
                    </div>
                </ButtonComponent>
                <Switch>
                    <Match when={props.definition.type === 'object' && (props.definition as TsonObjectDefinition).properties}>
                        <For each={Object.keys((props.definition as TsonObjectDefinition).properties)}>
                            {(property) => (
                                <TsonPathItemComponent
                                    name={property}
                                    path={`${props.path ? `${props.path}.` : ''}${property}`}
                                    selectedPath={props.selectedPath}
                                    definition={(props.definition as TsonObjectDefinition).properties[property]}
                                    selectableDefinition={props.selectableDefinition}
                                    onSelect={props.onSelect}
                                />
                            )}
                        </For>
                    </Match>
                </Switch>
            </>}
        </TreeViewItemFragment>
    );
}

export function VariablePathSelectorComponent(props: { locals: Record<string, TsonDefinition>; selectedName?: string; selectedPath?: string; selectableDefinition?: TsonDefinition; preview?: string; onChange: (name: string, path: string) => void }) {

    const names = createMemo(() => Object.keys(props.locals));
    const [browsedName, setBrowsedName] = createSignal(props.selectedName);

    return (
        <div class={classes().container}>
            <div class={classes().header}>{props.preview || '{{ }}'}</div>
            <div class={classes().items}>
                <For each={names()}>
                    {(name) => (
                        <ButtonComponent
                            appearance={'flat'}
                            label={name}
                            selected={name === browsedName()}
                            style={{ 'justify-content': 'left' }}
                            onClick={() => setBrowsedName(name)}
                        />
                    )}
                </For>
            </div>
            <div class={classes().paths}>
                <Show when={browsedName() && props.locals[browsedName()]}>
                    <TsonPathItemComponent
                        name={browsedName()}
                        selectedPath={browsedName() === props.selectedName ? (props.selectedPath ?? '') : undefined}
                        definition={props.locals[browsedName()]}
                        selectableDefinition={props.selectableDefinition}
                        onSelect={path => props.onChange(browsedName(), path)}
                    />
                </Show>
            </div>
        </div>
    );
}
