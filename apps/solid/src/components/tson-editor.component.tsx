import { $Tson, $Value, MapAdaptor, TsonArrayDefinition, TsonBooleanDefinition, TsonDefinition, TsonEnumDefinition, TsonNumberDefinition, TsonObjectDefinition, TsonRecordDefinition, TsonStringDefinition } from '@vorplex/core';
import { createStyle, useCachedSignal, useInjector } from '@vorplex/solid';
import { Accessor, createContext, createMemo, createSignal, For, Match, Setter, Show, Switch, useContext } from 'solid-js';
import { parse, stringify } from 'yaml';
import { Theme } from '../consts/theme';
import { ModalService } from '../services/modal.service';
import { ButtonComponent } from './button.component';
import { createTableClasses } from './create-table-classes.function';
import { FieldComponent, FormInputComponent } from './forms/form-input.component';
import { CheckboxFormInputComponent } from './forms/inputs/checkbox.component';
import { DropdownFormInputComponent } from './forms/inputs/dropdown.component';
import { NumberFormInputComponent } from './forms/inputs/number.component';
import { TextFormInputComponent } from './forms/inputs/text.component';
import { RadioButtonComponent } from './radio-button.component';
import { MonacoComponent } from './script-editor/script-editor.component';


function updateDefinitionAtPath(definition: TsonDefinition, paths: string[], update: TsonDefinition) {
    if (paths.length === 0) return $Value.clone(update);
    definition = $Value.clone(definition);
    let currentDefinition = definition;
    for (let i = 0; i < paths.length; i++) {
        if (currentDefinition.type === 'object') {
            if (i === paths.length - 1) currentDefinition.properties = {
                ...currentDefinition.properties,
                [paths[i]]: update
            }
            else currentDefinition = currentDefinition.properties[paths[i]];
        } else if (currentDefinition.type === 'array') {
            if (i === paths.length - 1) currentDefinition.itemDefinition = update;
            else currentDefinition = currentDefinition.itemDefinition;
        } else if (currentDefinition.type === 'record') {
            if (i === paths.length - 1) currentDefinition.property = update;
            else currentDefinition = currentDefinition.property;
        }
    }
    return $Value.clone(definition);
}

function getDefinitionAtPath(definition: TsonDefinition, paths: string[]): TsonDefinition {
    for (const path of paths) {
        if (definition.type === 'object') definition = definition.properties[path];
        else if (definition.type === 'array') definition = definition.itemDefinition;
        else if (definition.type === 'record') definition = definition.property;
    }
    return definition ?? { type: 'any' };
}

const TSON_TYPE_OPTIONS = MapAdaptor.fromArray($Tson.definitions, item => [item, item]) as Record<TsonDefinition['type'], string>;

const TsonEditorBreadcrumbComponentClasses = createStyle(() => ({
    container: {
        display: 'grid',
        gridAutoFlow: 'column',
        gridAutoColumns: 'max-content',
        gap: '5px',
        alignItems: 'center'
    },
    crumb: {
        '&:first-child': {
            fontWeight: 'bold',
        },
        '&:hover': {
            cursor: 'pointer',
            textDecoration: 'underline',
            color: Theme().info.outline
        }
    }
}));
export function TsonEditorBreadcrumbComponent(props: {}) {


    const context = useContext(TsonEditorComponentContext);
    const crumbs = createMemo(() => [context.name, ...context.path()]);

    return (
        <div class={TsonEditorBreadcrumbComponentClasses().container}>
            <For each={crumbs()}>
                {(crumb, index) => (
                    <>
                        <span
                            class={TsonEditorBreadcrumbComponentClasses().crumb}
                            innerText={crumb}
                            onClick={() => context.setPath(index() === 0 ? [] : context.path().slice(0, index()))}
                        />
                        <Show when={index() < crumbs().length - 1}>
                            <span innerText={'/'} />
                        </Show>
                    </>
                )}
            </For>
        </div>
    );
}

const TsonEditorDefaultFieldClasses = createStyle(() => ({
    container: {
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        minWidth: 0,
        '& > :first-child': {
            flexShrink: 0,
        },
        '& > :nth-child(2)': {
            flex: '1 1 auto',
            minWidth: 0,
        }
    }
}));

const TsonStringEditorComponentClasses = createStyle(() => ({
    container: {
        display: 'grid',
        gridAutoRows: 'max-content',
        gap: '5px',
        overflow: 'auto'
    }
}));

export function TsonStringEditorComponent(props: { definition: TsonStringDefinition, onChange: (definition: TsonStringDefinition) => void }) {
    return (
        <div class={TsonStringEditorComponentClasses().container}>
            <FieldComponent
                label={'Default Value'}
                description={'The default value to assign if undefined'}
            >
                <div class={TsonEditorDefaultFieldClasses().container}>
                    <CheckboxFormInputComponent
                        value={props.definition.default != null}
                        onChange={value => props.onChange({ ...props.definition, default: value ? { value: undefined } : undefined })}
                    />
                    <Show when={props.definition.default != null}>
                        <TextFormInputComponent
                            nullable={true}
                            value={props.definition.default?.value}
                            onChange={value => props.onChange({ ...props.definition, default: { value } })}
                        />
                    </Show>
                </div>
            </FieldComponent>
            <FormInputComponent
                type={'number'}
                label={'Min Length'}
                description={'The minimum length of the text to allow'}
                value={props.definition.min}
                onChange={value => props.onChange({ ...props.definition, min: value })}
            />
            <FormInputComponent
                type={'number'}
                label={'Max Value'}
                description={'The maximum length of the text to allow'}
                value={props.definition.max}
                onChange={value => props.onChange({ ...props.definition, max: value })}
            />
            <FormInputComponent
                type={'text'}
                label={'Regex'}
                description={'A regex pattern the text should match'}
                value={props.definition.match}
                onChange={value => props.onChange({ ...props.definition, match: value })}
            />
        </div>
    );
}

const TsonNumberEditorComponentClasses = createStyle(() => ({
    container: {
        display: 'grid',
        gridAutoRows: 'max-content',
        gap: '5px',
        overflow: 'auto'
    }
}));
export function TsonNumberEditorComponent(props: { definition: TsonNumberDefinition, onChange: (definition: TsonNumberDefinition) => void }) {
    return (
        <div class={TsonNumberEditorComponentClasses().container}>
            <FieldComponent
                label={'Default Value'}
                description={'The default value to assign if undefined'}
            >
                <div class={TsonEditorDefaultFieldClasses().container}>
                    <CheckboxFormInputComponent
                        value={props.definition.default != null}
                        onChange={value => props.onChange({ ...props.definition, default: value ? { value: undefined } : undefined })}
                    />
                    <Show when={props.definition.default != null}>
                        <NumberFormInputComponent
                            nullable={true}
                            value={props.definition.default?.value}
                            onChange={value => props.onChange({ ...props.definition, default: { value } })}
                        />
                    </Show>
                </div>
            </FieldComponent>
            <FormInputComponent
                type={'number'}
                label={'Min Value'}
                description={'The minimum value the number is allowed to be'}
                value={props.definition.min}
                onChange={value => props.onChange({ ...props.definition, min: value })}

            />
            <FormInputComponent
                type={'number'}
                label={'Max Value'}
                description={'The maximum value the number is allowed to be'}
                value={props.definition.max}
                onChange={value => props.onChange({ ...props.definition, max: value })}

            />
            <FormInputComponent
                label={'Is Integer'}
                type={'checkbox'}
                description={'If only integer values should be allowed'}
                value={props.definition.integer}
                onChange={value => props.onChange({ ...props.definition, integer: value })}
            />
        </div>
    );
}

const TsonBooleanEditorComponentClasses = createStyle(() => ({
    container: {
        display: 'grid',
        gridAutoRows: 'max-content',
        gap: '5px',
        overflow: 'auto'
    }
}));
export function TsonBooleanEditorComponent(props: { definition: TsonBooleanDefinition, onChange: (definition: TsonBooleanDefinition) => void }) {
    return (
        <div class={TsonBooleanEditorComponentClasses().container}>
            <FormInputComponent
                type={'checkbox'}
                label={'Default Value'}
                description={'The default value to return is the value is not defined'}
                nullable={true}
                value={props.definition.default?.value}
                onChange={value => props.onChange({ ...props.definition, default: value == null ? null : { value } })}
            />
        </div>
    );
}

const TsonEnumEditorComponentClasses = createStyle(() => ({
    container: {
        display: 'grid',
        gridAutoRows: 'max-content',
        gap: '5px',
        overflow: 'auto'
    }
}));

const flagsTableClasses = createTableClasses(() => ({
    columns: 'auto max-content'
}));

export function TsonEnumEditorComponent(props: { definition: TsonEnumDefinition, onChange: (definition: TsonEnumDefinition) => void }) {

    return (
        <div class={TsonEnumEditorComponentClasses().container}>
            <div class={flagsTableClasses().table}>
                <div class={flagsTableClasses().header}>
                    <div class={flagsTableClasses().row}>
                        <div class={flagsTableClasses().cell}>Flags</div>
                        <div class={flagsTableClasses().cell}>
                            <ButtonComponent
                                appearance={'flat'}
                                icon={'plus'}
                                onClick={() => {
                                    props.onChange({
                                        ...props.definition,
                                        flags: [...(props.definition.flags ?? []), '[flag]']
                                    });
                                }}
                            />
                        </div>
                    </div>
                </div>
                <div class={flagsTableClasses().body}>
                    <For each={props.definition.flags ?? []}>
                        {(flag, index) => {
                            return (
                                <div class={flagsTableClasses().row}>
                                    <div class={flagsTableClasses().cell}>
                                        <TextFormInputComponent flat={true} value={String(flag)} onChanged={value => {
                                            const flags = [...props.definition.flags];
                                            flags[index()] = value;
                                            props.onChange({
                                                ...props.definition,
                                                flags,
                                                default: props.definition.default?.value === flag ? { value } : props.definition.default
                                            });
                                        }} />
                                    </div>
                                    <div class={flagsTableClasses().cell}>
                                        <ButtonComponent
                                            appearance={'flat'}
                                            icon={'x'}
                                            onClick={() => {
                                                const flags = [...props.definition.flags];
                                                flags.splice(index(), 1);
                                                props.onChange({
                                                    ...props.definition,
                                                    flags,
                                                });
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        }}
                    </For>
                </div>
            </div>
            <Show when={(props.definition.flags ?? []).length > 0}>
                <FormInputComponent
                    type={'dropdown'}
                    label={'Default Value'}
                    description={'The default value to assign if undefined'}
                    clearable={true}
                    value={props.definition.default == null ? undefined : String(props.definition.default.value)}
                    options={Object.fromEntries((props.definition.flags ?? []).map(flag => [String(flag), String(flag)]))}
                    onChange={value => props.onChange({ ...props.definition, default: { value } })}
                />
            </Show>
        </div>
    );
}

const TsonArrayEditorComponentClasses = createStyle(() => ({
    container: {
        display: 'grid',
        gridAutoRows: 'max-content',
        gap: '5px',
        overflow: 'auto'
    },
    item: {
        display: 'grid',
        gridTemplateColumns: 'auto',
        gridAutoFlow: 'column',
        gridAutoColumns: 'max-content',
        alignItems: 'center',
        gap: '5px',
        overflow: 'hidden',
        padding: '5px 10px',
        borderRadius: '5px',
        border: `1px solid ${Theme().outline.primary}`,
        background: Theme().secondary.color,
        color: Theme().secondary.text,
    }
}));
export function TsonArrayEditorComponent(props: { definition: TsonArrayDefinition, onChange: (definition: TsonArrayDefinition) => void }) {

    const context = useContext(TsonEditorComponentContext);

    return (
        <div class={TsonArrayEditorComponentClasses().container}>
            <div class={TsonArrayEditorComponentClasses().item}>
                <span innerText={'Item'} />
                <DropdownFormInputComponent
                    value={props.definition.itemDefinition?.type}
                    placeholder={'[null]'}
                    options={TSON_TYPE_OPTIONS}
                    onChange={value => props.onChange({
                        ...props.definition,
                        itemDefinition: {
                            ...props.definition.itemDefinition,
                            type: value as any
                        }
                    })}
                />
                <ButtonComponent
                    icon={'pen'}
                    onClick={() => context.setPath(context.path().concat('[item]'))}
                />
            </div>
            <FormInputComponent
                type={'number'}
                label={'Min Length'}
                description={'The minimum length of the array to allow'}
                value={props.definition.min}
                onChange={value => props.onChange({ ...props.definition, min: value })}

            />
            <FormInputComponent
                type={'number'}
                label={'Max Length'}
                description={'The maximum length of the array to allow'}
                value={props.definition.max}
                onChange={value => props.onChange({ ...props.definition, max: value })}

            />
            <FormInputComponent
                type={'code'}
                inline={true}
                language={'yaml'}
                label={'Default Value (YAML)'}
                description={'The default value to return is the value is not defined'}
                value={stringify(props.definition.default?.value)}
                onChange={value => props.onChange({ ...props.definition, default: value.trim() === '' ? undefined : { value: parse(value) } })}
            />
        </div>
    );
}

export function TsonRecordEditorComponent(props: { definition: TsonRecordDefinition, onChange: (definition: TsonRecordDefinition) => void }) {

    const context = useContext(TsonEditorComponentContext);

    return (
        <div class={TsonArrayEditorComponentClasses().container}>
            <div class={TsonArrayEditorComponentClasses().item}>
                <span innerText={'Key'} />
                <DropdownFormInputComponent
                    value={props.definition.property?.type}
                    placeholder={'[null]'}
                    options={TSON_TYPE_OPTIONS}
                    onChange={value => props.onChange({
                        ...props.definition,
                        property: $Tson.getDefaultDefinition(value)
                    })}
                />
                <ButtonComponent
                    icon={'pen'}
                    onClick={() => context.setPath(context.path().concat('[key]'))}
                />
            </div>
            <FormInputComponent
                type={'code'}
                inline={true}
                language={'yaml'}
                label={'Default Value (YAML)'}
                description={'The default value to return is the value is not defined'}
                value={stringify(props.definition.default?.value)}
                onChange={value => props.onChange({ ...props.definition, default: value.trim() === '' ? undefined : { value: parse(value) } })}
            />
        </div>
    );
}

const TsonObjectEditorComponentClasses = createStyle(() => ({
    container: {
        display: 'grid',
        gridAutoRows: 'max-content',
        gap: '5px',
        overflow: 'auto'
    }
}));

const propertiesTableClasses = createTableClasses(() => ({
    columns: 'auto repeat(3, max-content)',
    classes: {
        row: {
            '& > :first-child:hover': {
                cursor: 'pointer',
                textDecoration: 'underline'
            }
        }
    }
}));

export function TsonObjectEditorComponent(props: { name: string, definition: TsonObjectDefinition, onChange: (definition: TsonObjectDefinition) => void }) {

    const services = useInjector({
        modal: ModalService
    });
    const context = useContext(TsonEditorComponentContext);

    return (
        <div class={TsonObjectEditorComponentClasses().container}>
            <div class={propertiesTableClasses().table}>
                <div class={propertiesTableClasses().header}>
                    <div class={propertiesTableClasses().row}>
                        <div class={propertiesTableClasses().cell}>Properties</div>
                        <div class={propertiesTableClasses().cell}>Type</div>
                        <div class={propertiesTableClasses().cell} />
                        <div class={propertiesTableClasses().cell}>
                            <ButtonComponent
                                icon={'plus'}
                                appearance={'flat'}
                                onClick={() => {
                                    props.onChange({
                                        ...props.definition,
                                        properties: {
                                            ...props.definition.properties,
                                            ['[property]']: { type: 'string' }
                                        }
                                    });
                                }}
                            />
                        </div>
                    </div>
                </div>
                <div class={propertiesTableClasses().body}>
                    <For each={Object.entries<TsonDefinition>(props.definition.properties ?? {}).toSorted()}>
                        {([property, propertyDefinition]) => (
                            <div class={propertiesTableClasses().row}>
                                <div class={propertiesTableClasses().cell}>
                                    <div>
                                        <TextFormInputComponent
                                            flat={true}
                                            value={property}
                                            onChanged={value => {
                                                props.onChange({
                                                    ...props.definition,
                                                    properties: MapAdaptor.rename(props.definition.properties, property, value)
                                                } as TsonObjectDefinition);
                                            }}
                                        />
                                    </div>
                                </div>
                                <div class={propertiesTableClasses().cell}>
                                    <DropdownFormInputComponent
                                        value={propertyDefinition.type}
                                        options={TSON_TYPE_OPTIONS}
                                        onChange={value => props.onChange({
                                            ...props.definition,
                                            properties: {
                                                ...props.definition.properties,
                                                [property]: $Tson.getDefaultDefinition(value)
                                            }
                                        } as TsonObjectDefinition)}
                                    />
                                </div>
                                <div class={propertiesTableClasses().cell}>
                                    <ButtonComponent
                                        appearance={'flat'}
                                        icon={'pen'}
                                        onClick={() => context.setPath(context.path().concat(property))}
                                    />
                                </div>
                                <div class={propertiesTableClasses().cell}>
                                    <ButtonComponent
                                        appearance={'flat'}
                                        icon={'minus'}
                                        onClick={() => {
                                            const properties = $Value.clone(props.definition.properties);
                                            delete properties[property];
                                            props.onChange({
                                                ...props.definition,
                                                properties
                                            });
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </For>
                </div>
            </div>
            <FormInputComponent
                type={'code'}
                inline={true}
                language={'yaml'}
                label={'Default Value (YAML)'}
                description={'The default value to return is the value is not defined'}
                value={stringify(props.definition.default?.value)}
                onChange={value => props.onChange({ ...props.definition, default: value.trim() === '' ? undefined : { value: parse(value) } })}
            />
        </div >
    );
}

export const TsonEditorComponentContext = createContext<{ name: string, path: Accessor<string[]>, setPath: Setter<string[]>, definition: TsonDefinition }>();

const TsonEditorComponentClasses = createStyle(() => ({
    container: {
        display: 'grid',
        gridTemplateRows: 'max-content auto',
        gap: '5px',
        overflow: 'hidden',
        background: Theme().background.color,
        color: Theme().background.text
    },
    header: {
        display: 'grid',
        gridTemplateColumns: 'auto',
        gridAutoFlow: 'column',
        gridAutoColumns: 'max-content',
        gap: '5px',
        overflow: 'hidden',
        alignItems: 'center',
        borderRadius: '5px',
        border: `1px solid ${Theme().outline.primary}`,
        padding: '5px 10px',
        background: Theme().primary.color,
        color: Theme().primary.text
    }
}));
export function TsonEditorComponent(props: { name: string, definition: TsonDefinition, onChange: (definition: TsonDefinition) => void }) {

    const [path, setPath] = createSignal<string[]>([]);
    const [mode, setMode] = useCachedSignal<'design' | 'tson'>(`${TsonEditorComponent}.mode`, 'design');
    const activeDefinition = createMemo(() => getDefinitionAtPath(props.definition, path()));

    return (
        <TsonEditorComponentContext.Provider value={{ name: props.name, path, setPath, definition: activeDefinition() }}>
            <div class={TsonEditorComponentClasses().container}>
                <div class={TsonEditorComponentClasses().header}>
                    <TsonEditorBreadcrumbComponent />
                    <RadioButtonComponent
                        options={[
                            { value: 'design' as const, icon: 'pencil-ruler' },
                            { value: 'tson' as const, icon: 'code' }
                        ]}
                        value={mode()}
                        onChange={mode => setMode(mode)}
                    />
                    <DropdownFormInputComponent
                        value={activeDefinition().type}
                        options={TSON_TYPE_OPTIONS}
                        onChange={value => props.onChange(updateDefinitionAtPath(props.definition, path(), $Tson.getDefaultDefinition(value)))}
                    />
                </div>
                <Switch>
                    <Match when={mode() === 'design'}>
                        <Switch>
                            <Match when={activeDefinition().type === 'string'}>
                                <TsonStringEditorComponent definition={activeDefinition() as TsonStringDefinition} onChange={definition => props.onChange(updateDefinitionAtPath(props.definition, path(), definition))} />
                            </Match>
                            <Match when={activeDefinition().type === 'number'}>
                                <TsonNumberEditorComponent definition={activeDefinition() as TsonNumberDefinition} onChange={definition => props.onChange(updateDefinitionAtPath(props.definition, path(), definition))} />
                            </Match>
                            <Match when={activeDefinition().type === 'boolean'}>
                                <TsonBooleanEditorComponent definition={activeDefinition() as TsonBooleanDefinition} onChange={definition => props.onChange(updateDefinitionAtPath(props.definition, path(), definition))} />
                            </Match>
                            <Match when={activeDefinition().type === 'enum'}>
                                <TsonEnumEditorComponent definition={activeDefinition() as TsonEnumDefinition} onChange={definition => props.onChange(updateDefinitionAtPath(props.definition, path(), definition))} />
                            </Match>
                            <Match when={activeDefinition().type === 'object'}>
                                <TsonObjectEditorComponent name={props.name} definition={activeDefinition() as TsonObjectDefinition} onChange={definition => props.onChange(updateDefinitionAtPath(props.definition, path(), definition))} />
                            </Match>
                            <Match when={activeDefinition().type === 'array'}>
                                <TsonArrayEditorComponent definition={activeDefinition() as TsonArrayDefinition} onChange={definition => props.onChange(updateDefinitionAtPath(props.definition, path(), definition))} />
                            </Match>
                            <Match when={activeDefinition().type === 'record'}>
                                <TsonRecordEditorComponent definition={activeDefinition() as TsonRecordDefinition} onChange={definition => props.onChange(updateDefinitionAtPath(props.definition, path(), definition))} />
                            </Match>
                        </Switch>
                    </Match>
                    <Match when={mode() === 'tson'}>
                        <MonacoComponent
                            language={'yaml'}
                            value={stringify(props.definition)}
                            onChange={value => props.onChange(parse(value))}
                        />
                    </Match>
                </Switch>
            </div>
        </TsonEditorComponentContext.Provider>
    );
}
