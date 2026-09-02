import { $Id, $Tson } from '@vorplex/core';
import { createStyle, defineRemountingComponent, useInjector, useStore } from '@vorplex/solid';
import { createMemo, createSignal, For, Match, Switch } from 'solid-js';
import { ButtonComponent } from '../../../../components/button.component';
import { createTableClasses } from '../../../../components/create-table-classes.function';
import { FormInputComponent } from '../../../../components/forms/form-input.component';
import { CheckboxFormInputComponent } from '../../../../components/forms/inputs/checkbox.component';
import { DropdownFormInputComponent } from '../../../../components/forms/inputs/dropdown.component';
import { TextFormInputComponent } from '../../../../components/forms/inputs/text.component';
import { RadioButtonComponent } from '../../../../components/radio-button.component';
import { PlatformService } from '../../../../services/platform.service';

const classes = createStyle(() => ({
    container: {
        display: 'grid',
        gridAutoRows: 'max-content',
        gap: '10px',
        overflow: 'auto',
        padding: '10px'
    },
    address: {
        display: 'grid',
        gridTemplateColumns: 'max-content auto',
        gap: '5px'
    }
}));

const tableClasses = createTableClasses(() => ({
    columns: 'auto auto max-content max-content'
}));

export const EndpointEditorComponent = defineRemountingComponent((props: { endpointId: string }) => {

    const service = useInjector({
        platform: PlatformService
    });

    const shtml = useStore(service.platform.shtml.state);
    const endpoint = shtml.apiEndpoints[props.endpointId];
    const tabs = [
        { value: 'parameters' as const, label: 'Parameters' },
        { value: 'headers' as const, label: 'Headers' },
        { value: 'body' as const, label: 'Body' },
        { value: 'response' as const, label: 'Response' }
    ];
    const [tab, setTab] = createSignal<typeof tabs[number]['value']>('parameters');

    const typeOptions = createMemo(() => {
        const options: Record<string, string> = Object.fromEntries($Tson.definitions.map(type => [type, type]));
        for (const typeId of shtml.app.typeIds()) {
            const type = shtml.types[typeId];
            options[type.name()] = type.name();
        }
        return options;
    });

    return (
        <div class={classes().container}>
            <div class={classes().address}>
                <DropdownFormInputComponent
                    value={endpoint.method()}
                    options={{
                        GET: 'GET',
                        POST: 'POST',
                        PUT: 'PUT',
                        PATCH: 'PATCH',
                        DELETE: 'DELETE'
                    }}
                    onChange={value => endpoint.method(value ?? 'GET')}
                />
                <TextFormInputComponent
                    value={endpoint.path()}
                    placeholder={'/path/{param}'}
                    onChange={value => endpoint.path(value)}
                />
            </div>
            <RadioButtonComponent
                options={tabs}
                value={tab()}
                onChange={value => setTab(value)}
            />
            <Switch>
                <Match when={tab() === 'parameters'}>
                    <div class={tableClasses().table}>
                        <div class={tableClasses().header}>
                            <div class={tableClasses().cell}>Name</div>
                            <div class={tableClasses().cell}>Description</div>
                            <div class={tableClasses().cell}>Required</div>
                            <div class={tableClasses().cell}>
                                <ButtonComponent
                                    icon='plus'
                                    appearance='flat'
                                    onClick={() => {
                                        const parameter = { id: $Id.guid(), name: '', required: false };
                                        service.platform.shtml.state.reduce(reducer => [
                                            reducer.apiParameters.entity.create(parameter),
                                            reducer.apiEndpoints.entity.updateById(props.endpointId, endpoint => ({ parameterIds: [...endpoint.parameterIds, parameter.id] }))
                                        ]);
                                    }}
                                />
                            </div>
                        </div>
                        <div class={tableClasses().body}>
                            <For each={endpoint.parameterIds()}>
                                {id => {
                                    const parameter = shtml.apiParameters[id];
                                    return (
                                        <div class={tableClasses().row}>
                                            <div class={tableClasses().cell}>
                                                <TextFormInputComponent value={parameter.name()} onChange={value => parameter.name(value)} />
                                            </div>
                                            <div class={tableClasses().cell}>
                                                <TextFormInputComponent value={parameter.description()} onChange={value => parameter.description(value === '' ? undefined : value)} />
                                            </div>
                                            <div class={tableClasses().cell}>
                                                <CheckboxFormInputComponent value={parameter.required()} onChange={value => parameter.required(value)} />
                                            </div>
                                            <div class={tableClasses().cell}>
                                                <ButtonComponent
                                                    appearance={'flat'}
                                                    icon={'minus'}
                                                    onClick={() => {
                                                        service.platform.shtml.state.reduce(reducer => [
                                                            reducer.apiParameters.entity.delete(id),
                                                            reducer.apiEndpoints.entity.updateById(props.endpointId, endpoint => ({ parameterIds: endpoint.parameterIds.filter(existing => existing !== id) }))
                                                        ]);
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                }}
                            </For>
                        </div>
                    </div>
                </Match>
                <Match when={tab() === 'headers'}>
                    <div class={tableClasses().table}>
                        <div class={tableClasses().header}>
                            <div class={tableClasses().cell}>Name</div>
                            <div class={tableClasses().cell}>Description</div>
                            <div class={tableClasses().cell}>Required</div>
                            <div class={tableClasses().cell}>
                                <ButtonComponent
                                    icon='plus'
                                    appearance='flat'
                                    onClick={() => {
                                        const header = { id: $Id.guid(), name: '', required: false };
                                        service.platform.shtml.state.reduce(reducer => [
                                            reducer.apiHeaders.entity.create(header),
                                            reducer.apiEndpoints.entity.updateById(props.endpointId, endpoint => ({ headerIds: [...endpoint.headerIds, header.id] }))
                                        ]);
                                    }}
                                />
                            </div>
                        </div>
                        <div class={tableClasses().body}>
                            <For each={endpoint.headerIds()}>
                                {id => {
                                    const header = shtml.apiHeaders[id];
                                    return (
                                        <div class={tableClasses().row}>
                                            <div class={tableClasses().cell}>
                                                <TextFormInputComponent value={header.name()} onChange={value => header.name(value)} />
                                            </div>
                                            <div class={tableClasses().cell}>
                                                <TextFormInputComponent value={header.description()} onChange={value => header.description(value === '' ? undefined : value)} />
                                            </div>
                                            <div class={tableClasses().cell}>
                                                <CheckboxFormInputComponent value={header.required()} onChange={value => header.required(value)} />
                                            </div>
                                            <div class={tableClasses().cell}>
                                                <ButtonComponent
                                                    appearance={'flat'}
                                                    icon={'minus'}
                                                    onClick={() => {
                                                        service.platform.shtml.state.reduce(reducer => [
                                                            reducer.apiHeaders.entity.delete(id),
                                                            reducer.apiEndpoints.entity.updateById(props.endpointId, endpoint => ({ headerIds: endpoint.headerIds.filter(existing => existing !== id) }))
                                                        ]);
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                }}
                            </For>
                        </div>
                    </div>
                </Match>
                <Match when={tab() === 'body'}>
                    <FormInputComponent
                        type={'dropdown'}
                        label={'Body Type'}
                        clearable={true}
                        options={typeOptions()}
                        value={endpoint.bodyId() ? shtml.apiBodies[endpoint.bodyId()].type() : undefined}
                        onChange={type => {
                            const bodyId = endpoint.bodyId();
                            if (type == null) {
                                if (!bodyId) return;
                                service.platform.shtml.state.reduce(reducer => [
                                    reducer.apiBodies.entity.delete(bodyId),
                                    reducer.apiEndpoints.entity.updateById(props.endpointId, () => ({ bodyId: undefined }))
                                ]);
                                return;
                            }
                            if (bodyId) {
                                shtml.apiBodies[bodyId].type(type);
                                return;
                            }
                            const body = { id: $Id.guid(), type };
                            service.platform.shtml.state.reduce(reducer => [
                                reducer.apiBodies.entity.create(body),
                                reducer.apiEndpoints.entity.updateById(props.endpointId, () => ({ bodyId: body.id }))
                            ]);
                        }}
                    />
                </Match>
                <Match when={tab() === 'response'}>
                    <FormInputComponent
                        type={'dropdown'}
                        label={'Response Type'}
                        clearable={true}
                        options={typeOptions()}
                        value={endpoint.responseId() ? shtml.apiResponses[endpoint.responseId()].type() : undefined}
                        onChange={type => {
                            const responseId = endpoint.responseId();
                            if (type == null) {
                                if (!responseId) return;
                                service.platform.shtml.state.reduce(reducer => [
                                    reducer.apiResponses.entity.delete(responseId),
                                    reducer.apiEndpoints.entity.updateById(props.endpointId, () => ({ responseId: undefined }))
                                ]);
                                return;
                            }
                            if (responseId) {
                                shtml.apiResponses[responseId].type(type);
                                return;
                            }
                            const response = { id: $Id.guid(), type };
                            service.platform.shtml.state.reduce(reducer => [
                                reducer.apiResponses.entity.create(response),
                                reducer.apiEndpoints.entity.updateById(props.endpointId, () => ({ responseId: response.id }))
                            ]);
                        }}
                    />
                </Match>
            </Switch>
        </div>
    );
});
