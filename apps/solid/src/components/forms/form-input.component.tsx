import { Awaitable } from '@vorplex/core';
import { createStyle } from '@vorplex/solid';
import { classNames } from '@vorplex/web';
import { createSignal, type JSXElement } from 'solid-js';
import { Match, Show, Switch } from 'solid-js/web';
import { Theme } from '../../consts/theme';
import { Icon } from '../icon.component';
import { type CheckboxFormInput, CheckboxFormInputComponent } from './inputs/checkbox.component';
import { type ColorFormInput, ColorFormInputComponent } from './inputs/color.component';
import { type DateFormInput, DateFormInputComponent } from './inputs/date.component';
import { type DropdownFormInput, DropdownFormInputComponent } from './inputs/dropdown.component';
import { type FileFormInput, FileFormInputComponent } from './inputs/file.component';
import { type NumberFormInput, NumberFormInputComponent } from './inputs/number.component';
import { type TagsFormInput, TagsFormInputComponent } from './inputs/tags.component';
import { type TextFormInput, TextFormInputComponent } from './inputs/text.component';
import { type TextAreaFormInput, TextAreaFormInputComponent } from './inputs/textarea.component';

export type FormInputType = 'text' | 'number' | 'checkbox' | 'color' | 'date' | 'dropdown' | 'textarea' | 'code' | 'modal' | 'tags' | 'file';

type FormLayoutProps<TType extends FormInputType = FormInputType, TValue = any> = {
    type: TType;
    value?: TValue;
    label: string;
    subText?: string;
    description?: string;
    error?: string;
    warning?: string;
    hidden?: boolean;
    disabled?: boolean;
    validate?: (value: TValue) => Awaitable<{ error?: string; warning?: string }>;
    onChange?: (value: TValue) => void;
};

export type TextFormGroup = TextFormInput & FormLayoutProps<'text', string>;
export type CheckboxFormGroup = CheckboxFormInput & FormLayoutProps<'checkbox', boolean>;
export type ColorFormGroup = ColorFormInput & FormLayoutProps<'color', string>;
export type DateFormGroup = DateFormInput & FormLayoutProps<'date', Date>;
export type NumberFormGroup = NumberFormInput & FormLayoutProps<'number', number>;
export type DropdownFormGroup = DropdownFormInput & FormLayoutProps<'dropdown', string>;
export type TextAreaFormGroup = TextAreaFormInput & FormLayoutProps<'textarea', string>;
export type TagsFormGroup = TagsFormInput & FormLayoutProps<'tags', string[]>;
export type FileFormGroup = FileFormInput & FormLayoutProps<'file', File[]>;

export type FormInputs =
    | TextFormGroup
    | CheckboxFormGroup
    | ColorFormGroup
    | DateFormGroup
    | NumberFormGroup
    | DropdownFormGroup
    | TextAreaFormGroup
    | TagsFormGroup
    | FileFormGroup;

export const FormInputClasses = createStyle(() => ({
    container: {
        display: 'grid',
        gridAutoRows: 'max-content',
        alignItems: 'center',
        gap: '2.5px',
        overflow: 'hidden',
        padding: '5px 10px',
        borderLeft: `1px solid transparent`,
        borderRadius: '5px',
        '&.hidden': {
            display: 'none'
        },
        '&.disabled': {
            pointerEvents: 'none',
        },
        '&.readonly': {
            pointerEvents: 'none'
        },
        '&.warning': {
            borderRadius: '0px 5px 5px 0px',
            borderLeft: `1px solid ${Theme().warning.outline}`,
        },
        '&.error': {
            borderRadius: '0px 5px 5px 0px',
            borderLeft: `1px solid ${Theme().error.outline}`,
        },
        '&:hover, &:focus-within': {
            boxShadow: Theme().hoverShadow,
        },
        '&.inline': {
            gridTemplateColumns: 'auto',
            gridAutoFlow: 'column',
            gridAutoColumns: 'max-content',
            gap: '10px',
        },
    },
    layout: {
        display: 'grid',
        gridAutoRows: 'max-content',
        alignItems: 'center',
        gap: '2.5px',
        overflow: 'hidden'
    },
    labelRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
    },
    label: {
        fontSize: '14px',
        fontWeight: 'bold',
    },
    subText: {
        fontSize: '12px',
        color: Theme().input.subText,
    },
    description: {
        color: Theme().background.subText,
    },
    error: {
        display: 'grid',
        gridTemplateColumns: 'max-content auto',
        gap: '5px',
        overflow: 'hidden',
        alignItems: 'center',
        color: Theme().error.outline,
    },
    warning: {
        display: 'grid',
        gridTemplateColumns: 'max-content auto',
        gap: '5px',
        overflow: 'hidden',
        alignItems: 'center',
        color: Theme().warning.outline,
    },
    errorIcon: {
        color: Theme().error.outline,
    },
    warningIcon: {
        color: Theme().warning.outline,
    },
}));

export function FormInputErrorComponent(props: { error: string }) {
    return (
        <Show when={props.error}>
            <div class={FormInputClasses().error}>
                <Icon class={FormInputClasses().errorIcon} name={'shield-x'} />
                <span>{props.error}</span>
            </div>
        </Show>
    );
}

export function FormInputWarningComponent(props: { warning: string }) {
    return (
        <Show when={props.warning}>
            <div class={FormInputClasses().warning}>
                <Icon class={FormInputClasses().warningIcon} name={'shield-alert'} />
                <span>{props.warning}</span>
            </div>
        </Show>
    );
}

export function FormInputLabelComponent(props: { label: string; subText?: string }) {
    return (
        <div class={FormInputClasses().labelRow}>
            <div class={FormInputClasses().label}>{props.label}</div>
            <Show when={props.subText}>
                <div class={FormInputClasses().subText}>{props.subText}</div>
            </Show>
        </div>
    );
}

export function FormInputDescriptionComponent(props: { description: string }) {
    return (
        <Show when={props.description}>
            <div class={FormInputClasses().description}>{props.description}</div>
        </Show>
    );
}

type FormInputLayoutProps = FormLayoutProps & { children: JSXElement };

export function FormInputLayoutComponent(props: FormInputLayoutProps) {
    return (
        <div
            class={classNames(FormInputClasses().container, {
                error: !!props.error,
                warning: !!props.warning,
                disabled: props.disabled,
                hidden: props.hidden
            })}
        >
            <FormInputLabelComponent label={props.label} subText={props.subText} />
            <FormInputDescriptionComponent description={props.description} />
            {props.children}
            <FormInputErrorComponent error={props.error} />
            <FormInputWarningComponent warning={props.warning} />
        </div>
    );
}

export function InlineFormInputLayoutComponent(props: FormInputLayoutProps) {
    return (
        <div
            class={classNames(FormInputClasses().container, 'inline', {
                error: !!props.error,
                warning: !!props.warning,
                disabled: props.disabled,
                hidden: props.hidden
            })}
        >
            <div class={FormInputClasses().layout}>
                <FormInputLabelComponent label={props.label} subText={props.subText} />
                <FormInputDescriptionComponent description={props.description} />
                <FormInputErrorComponent error={props.error} />
                <FormInputWarningComponent warning={props.warning} />
            </div>
            {props.children}
        </div>
    );
}

export function FormInputComponent(input: FormInputs) {
    return (
        <Switch>
            <Match when={input.type === 'text'}>
                <FormInputLayoutComponent type={input.type} label={input.label} subText={input.subText} description={input.description} error={input.error} warning={input.warning} disabled={input.disabled} hidden={input.hidden}>
                    <TextFormInputComponent {...(input as TextFormInput)} />
                </FormInputLayoutComponent>
            </Match>
            <Match when={input.type === 'tags'}>
                <FormInputLayoutComponent type={input.type} label={input.label} subText={input.subText} description={input.description} error={input.error} warning={input.warning} disabled={input.disabled} hidden={input.hidden}>
                    <TagsFormInputComponent {...(input as TagsFormInput)} />
                </FormInputLayoutComponent>
            </Match>
            <Match when={input.type === 'textarea'}>
                <FormInputLayoutComponent type={input.type} label={input.label} subText={input.subText} description={input.description} error={input.error} warning={input.warning} disabled={input.disabled} hidden={input.hidden}>
                    <TextAreaFormInputComponent {...(input as TextAreaFormInput)} />
                </FormInputLayoutComponent>
            </Match>
            <Match when={input.type === 'number'}>
                <InlineFormInputLayoutComponent type={input.type} label={input.label} subText={input.subText} description={input.description} error={input.error} warning={input.warning} disabled={input.disabled} hidden={input.hidden}>
                    <NumberFormInputComponent {...(input as NumberFormInput)} />
                </InlineFormInputLayoutComponent>
            </Match>
            <Match when={input.type === 'checkbox'}>
                <InlineFormInputLayoutComponent type={input.type} label={input.label} subText={input.subText} description={input.description} error={input.error} warning={input.warning} disabled={input.disabled} hidden={input.hidden}>
                    <CheckboxFormInputComponent {...(input as CheckboxFormInput)} />
                </InlineFormInputLayoutComponent>
            </Match>
            <Match when={input.type === 'dropdown'}>
                <FormInputLayoutComponent type={input.type} label={input.label} subText={input.subText} description={input.description} error={input.error} warning={input.warning} disabled={input.disabled} hidden={input.hidden}>
                    <DropdownFormInputComponent {...(input as DropdownFormInput)} />
                </FormInputLayoutComponent>
            </Match>
            <Match when={input.type === 'date'}>
                <InlineFormInputLayoutComponent type={input.type} label={input.label} subText={input.subText} description={input.description} error={input.error} warning={input.warning} disabled={input.disabled} hidden={input.hidden}>
                    <DateFormInputComponent {...(input as DateFormInput)} />
                </InlineFormInputLayoutComponent>
            </Match>
            <Match when={input.type === 'color'}>
                <InlineFormInputLayoutComponent type={input.type} label={input.label} subText={input.subText} description={input.description} error={input.error} warning={input.warning} disabled={input.disabled} hidden={input.hidden}>
                    <ColorFormInputComponent {...(input as ColorFormInput)} />
                </InlineFormInputLayoutComponent>
            </Match>
            <Match when={input.type === 'file'}>
                <FormInputLayoutComponent type={input.type} label={input.label} subText={input.subText} description={input.description} error={input.error} warning={input.warning} disabled={input.disabled} hidden={input.hidden}>
                    <FileFormInputComponent {...(input as FileFormInput)} />
                </FormInputLayoutComponent>
            </Match>
        </Switch>
    );
}

const classes = createStyle(() => ({
    container: {
        display: 'grid',
        gridAutoRows: 'max-content',
        gap: '5px',
        overflow: 'auto',
        padding: '20px'
    }
}));

export function FormInputComponentPlayground() {
    const [settings, setSettings] = createSignal({
        type: 'text' as FormInputType,
        label: 'Label',
        description: 'Description',
        placeholder: 'Placeholder',
        disabled: false,
        warning: undefined,
        error: undefined,
        autoFocus: false,
        nullable: false,
        value: undefined,
        options: {
            a: 'ABSA',
            b: 'SARS',
            c: 'FNB',
            d: 'Nedbank',
            e: 'Standard Bank',
            f: 'Capitec',
            g: 'Capitec',
            h: 'Sybrin',
        }
    });

    return (
        <div class={classes().container}>
            <FormInputComponent
                type={'dropdown'}
                label={'Type'}
                options={{
                    text: 'Text',
                    checkbox: 'Checkbox',
                    dropdown: 'Dropdown',
                    number: 'Number',
                    date: 'Date',
                    color: 'Color',
                    textarea: 'Textarea',
                    modal: 'Modal',
                    yaml: 'YAML',
                    tags: 'Tags',
                    file: 'File'
                }}
                value={settings().type}
                onChange={value => setSettings(settings => ({ ...settings, type: value as FormInputType }))}
            />
            <FormInputComponent
                type={'text'}
                label={'Label'}
                value={settings().label}
                onChange={value => setSettings(settings => ({ ...settings, label: value }))}
            />
            <FormInputComponent
                type={'text'}
                label={'Description'}
                value={settings().description}
                onChange={value => setSettings(settings => ({ ...settings, description: value }))}
            />
            <FormInputComponent
                type={'text'}
                label={'Placeholder'}
                value={settings().placeholder}
                onChange={value => setSettings(settings => ({ ...settings, placeholder: value }))}
            />
            <FormInputComponent
                type={'checkbox'}
                label={'Disabled'}
                value={settings().disabled}
                onChange={value => setSettings(settings => ({ ...settings, disabled: value }))}
            />
            <FormInputComponent
                type={'checkbox'}
                label={'Nullable'}
                value={settings().nullable}
                onChange={value => setSettings(settings => ({ ...settings, nullable: value }))}
            />
            <FormInputComponent
                type={'text'}
                label={'Warning'}
                value={settings().warning}
                onChange={value => setSettings(settings => ({ ...settings, warning: value }))}
            />
            <FormInputComponent
                type={'text'}
                label={'Error'}
                value={settings().error}
                onChange={value => setSettings(settings => ({ ...settings, error: value }))}
            />
            <div style={{ height: '1px', background: Theme().outline.primary }} />
            <FormInputComponent
                type={settings().type as any}
                label={settings().label}
                description={settings().description}
                placeholder={settings().placeholder}
                warning={settings().warning}
                error={settings().error}
                autoFocus={settings().autoFocus}
                nullable={settings().nullable}
                multiple={true}
                disabled={settings().disabled}
                value={settings().value}
                options={settings().options as any}
                onChange={(value: any) => setSettings(settings => ({ ...settings, value }))}
            />
            <div
                style={{
                    'border-radius': '5px',
                    padding: '5px',
                    width: 'max-content',
                    background: Theme().info.color,
                    color: Theme().info.text
                }}
                innerText={'Info'}
            />
            <div
                style={{
                    'border-radius': '5px',
                    padding: '5px',
                    width: 'max-content',
                    background: Theme().success.color,
                    color: Theme().success.text
                }}
                innerText={'Success'}
            />
            <div
                style={{
                    'border-radius': '5px',
                    padding: '5px',
                    width: 'max-content',
                    background: Theme().warning.color,
                    color: Theme().warning.text
                }}
                innerText={'Warning'}
            />
            <div
                style={{
                    'border-radius': '5px',
                    padding: '5px',
                    width: 'max-content',
                    background: Theme().error.color,
                    color: Theme().error.text
                }}
                innerText={'Error'}
            />
        </div>
    );
}
