import { Awaitable } from '@vorplex/core';
import { createStyle } from '@vorplex/solid';
import { classNames } from '@vorplex/web';
import { createSignal, type JSXElement } from 'solid-js';
import { Show } from 'solid-js/web';
import { Theme } from '../../consts/theme';
import { Icon } from '../icon.component';
import { type CheckboxFormInput, CheckboxFormInputComponent } from './inputs/checkbox.component';
import { type CodeFormInput, CodeFormInputComponent } from './inputs/code.component';
import { type ColorFormInput, ColorFormInputComponent } from './inputs/color.component';
import { type DateFormInput, DateFormInputComponent } from './inputs/date.component';
import { type DropdownFormInput, DropdownFormInputComponent } from './inputs/dropdown.component';
import { type FileFormInput, FileFormInputComponent } from './inputs/file.component';
import { type ModalFormInput, ModalFormInputComponent } from './inputs/modal.component';
import { type NumberFormInput, NumberFormInputComponent } from './inputs/number.component';
import { type TagsFormInput, TagsFormInputComponent } from './inputs/tags.component';
import { type TextOptionFormInput, TextOptionFormInputComponent } from './inputs/text-option.component';
import { type TextFormInput, TextFormInputComponent } from './inputs/text.component';
import { type TextAreaFormInput, TextAreaFormInputComponent } from './inputs/textarea.component';

export type FormInputType = 'text' | 'text-option' | 'number' | 'checkbox' | 'color' | 'date' | 'dropdown' | 'textarea' | 'code' | 'modal' | 'tags' | 'file';

type FormLayoutFields = {
    label: string;
    subText?: string;
    description?: string;
    error?: string;
    warning?: string;
    hidden?: boolean;
    disabled?: boolean;
    inline?: boolean;
};

type FormLayoutProps<TType extends FormInputType = FormInputType, TValue = any> = FormLayoutFields & {
    type: TType;
    value?: TValue;
    validate?: (value: TValue) => Awaitable<{ error?: string; warning?: string }>;
    onChange?: (value: TValue) => void;
};

export type TextFormGroup = TextFormInput & FormLayoutProps<'text', string>;
export type TextOptionFormGroup = TextOptionFormInput & FormLayoutProps<'text-option', string>;
export type CheckboxFormGroup = CheckboxFormInput & FormLayoutProps<'checkbox', boolean>;
export type ColorFormGroup = ColorFormInput & FormLayoutProps<'color', string>;
export type DateFormGroup = DateFormInput & FormLayoutProps<'date', Date>;
export type NumberFormGroup = NumberFormInput & FormLayoutProps<'number', number>;
export type DropdownFormGroup = DropdownFormInput & FormLayoutProps<'dropdown', string>;
export type TextAreaFormGroup = TextAreaFormInput & FormLayoutProps<'textarea', string>;
export type TagsFormGroup = TagsFormInput & FormLayoutProps<'tags', string[]>;
export type FileFormGroup = FileFormInput & FormLayoutProps<'file', File[]>;
export type CodeFormGroup = CodeFormInput & FormLayoutProps<'code', string>;
export type ModalFormGroup = ModalFormInput & FormLayoutProps<'modal', any>;

export type FormInputs =
    | TextFormGroup
    | TextOptionFormGroup
    | CheckboxFormGroup
    | ColorFormGroup
    | DateFormGroup
    | NumberFormGroup
    | DropdownFormGroup
    | TextAreaFormGroup
    | TagsFormGroup
    | FileFormGroup
    | CodeFormGroup
    | ModalFormGroup;

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
        '&.inline': {
            gridTemplateColumns: 'auto',
            gridAutoFlow: 'column',
            gridAutoColumns: 'max-content',
            gap: '5px',
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

type FieldProps = FormLayoutFields & { children: JSXElement };

export function FieldComponent(props: FieldProps) {
    return (
        <div
            class={classNames(FormInputClasses().container, {
                inline: props.inline,
                error: !!props.error,
                warning: !!props.warning,
                disabled: props.disabled,
                hidden: props.hidden
            })}
        >
            <Show
                when={props.inline}
                fallback={
                    <>
                        <FormInputLabelComponent label={props.label} subText={props.subText} />
                        <FormInputDescriptionComponent description={props.description} />
                        {props.children}
                        <FormInputErrorComponent error={props.error} />
                        <FormInputWarningComponent warning={props.warning} />
                    </>
                }
            >
                <div class={FormInputClasses().layout}>
                    <FormInputLabelComponent label={props.label} subText={props.subText} />
                    <FormInputDescriptionComponent description={props.description} />
                    <FormInputErrorComponent error={props.error} />
                    <FormInputWarningComponent warning={props.warning} />
                </div>
                {props.children}
            </Show>
        </div>
    );
}

const FormFields: Record<FormInputType, (props: any) => JSXElement> = {
    text: TextFormInputComponent,
    'text-option': TextOptionFormInputComponent,
    tags: TagsFormInputComponent,
    textarea: TextAreaFormInputComponent,
    number: NumberFormInputComponent,
    checkbox: CheckboxFormInputComponent,
    dropdown: DropdownFormInputComponent,
    date: DateFormInputComponent,
    color: ColorFormInputComponent,
    file: FileFormInputComponent,
    code: CodeFormInputComponent,
    modal: ModalFormInputComponent,
};

export function FormInputComponent(input: FormInputs) {
    const Input = FormFields[input.type];
    return (
        <FieldComponent
            label={input.label}
            subText={input.subText}
            description={input.description}
            error={input.error}
            warning={input.warning}
            disabled={input.disabled}
            hidden={input.hidden}
            inline={input.inline}
        >
            <Input {...(input as any)} />
        </FieldComponent>
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
