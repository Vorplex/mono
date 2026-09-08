import { $Id, $String, State } from '@vorplex/core';
import { DrxApi, DrxApiEndpoint } from '@vorplex/drx';
import { useInjector } from '@vorplex/solid';
import { CodeFormGroup, DropdownFormGroup, TextFormGroup } from '../../../components/forms/form-input.component';
import { ContextMenuItem } from '../../../directives/context-menu.directive';
import { convertOpenAPIToDrx, OpenAPISpec } from '../../../openapi-to-drx.function';
import { ModalService } from '../../../services/modal.service';
import { PlatformService } from '../../../services/platform.service';
import { ExplorerNode, ExplorerService } from '../explorer.service';

export const ApiContextMenu: ContextMenuItem[] = [
    {
        icon: 'plus',
        text: 'Add',
        onClick: async () => {
            const service = useInjector({
                platform: PlatformService,
                explorer: ExplorerService,
                modal: ModalService
            });
            const result = await service.modal.showForm<{ name: TextFormGroup; url: TextFormGroup }>({
                title: 'Add Api',
                form: {
                    name: {
                        type: 'text',
                        label: 'Name'
                    },
                    url: {
                        type: 'text',
                        label: 'URL',
                        placeholder: 'https://...',
                        validate: value => ({ error: $String.isNullOrEmpty(value) ? 'Required' : null })
                    }
                }
            });
            if (!result) return;
            const api: DrxApi = {
                id: $Id.guid(),
                name: result.name,
                url: result.url,
                typeIds: [],
                endpointIds: []
            };
            service.platform.drx.state.reduce(reducer => [
                reducer.apis.entity.create(api),
                reducer.app.value.update(app => ({ apiIds: [...app.apiIds, api.id] }))
            ]);
            service.explorer.selectItem({ type: ExplorerNode.Api, id: api.id });
        }
    },
    {
        icon: 'import',
        text: 'Import',
        onClick: async () => {
            const service = useInjector({
                platform: PlatformService,
                explorer: ExplorerService,
                modal: ModalService
            });
            const form = new State<{ type: DropdownFormGroup; url: TextFormGroup; code: CodeFormGroup }>({
                type: {
                    type: 'dropdown',
                    label: 'Import From',
                    description: 'The OpenAPI JSON to import',
                    options: [
                        { value: 'url', label: 'URL' },
                        { value: 'json', label: 'JSON' }
                    ],
                    value: 'url',
                    onChange: value => {
                        form.update(form => ({
                            ...form,
                            code: { ...form.code, hidden: value !== 'json' },
                            url: { ...form.url, hidden: value !== 'url' }
                        }));
                    },
                    validate: value => ({ error: $String.isNullOrEmpty(value) ? 'Required' : null })
                },
                url: {
                    type: 'text',
                    label: 'URL',
                    autoFocus: true,
                    description: 'The URL of the OpenAPI/Swagger document',
                    placeholder: 'https://domain:9000/path/swagger/v1/swagger.json',
                    validate: value => ({ error: $String.isNullOrEmpty(value) ? 'Required' : null })
                },
                code: {
                    type: 'code',
                    label: 'JSON',
                    description: 'The OpenAPI JSON of the API',
                    language: 'json',
                    hidden: true,
                    validate: value => ({ error: $String.isNullOrEmpty(value) ? 'Required' : null })
                }
            });
            const result = await service.modal.showForm({
                title: 'Import API',
                form
            });
            if (!result) return;
            let spec: OpenAPISpec;
            try {
                if (result.type === 'url') {
                    const response = await fetch(result.url);
                    if (!response.ok) throw new Error(`Failed to fetch OpenAPI document (${response.status} ${response.statusText})`);
                    spec = await response.json();
                } else {
                    spec = JSON.parse(result.code);
                }
            } catch (error) {
                service.modal.showError(error instanceof Error ? error : String(error));
                return;
            }
            const converted = convertOpenAPIToDrx(spec);
            service.platform.drx.state.reduce(reducer => [
                reducer.types.entity.create(...converted.types),
                reducer.apiParameters.entity.create(...converted.parameters),
                reducer.apiHeaders.entity.create(...converted.headers),
                reducer.apiBodies.entity.create(...converted.bodies),
                reducer.apiResponses.entity.create(...converted.responses),
                reducer.apiEndpoints.entity.create(...converted.endpoints),
                reducer.apis.entity.create(converted.api),
                reducer.app.value.update(app => ({ apiIds: [...app.apiIds, converted.api.id] }))
            ]);
            service.explorer.selectItem({ type: ExplorerNode.Api, id: converted.api.id });
        }
    }
];

export function createApiItemContextMenu(apiId: string, apiName: string): ContextMenuItem[] {
    return [
        {
            icon: 'plus',
            text: 'Add Endpoint',
            onClick: async () => {
                const service = useInjector({
                    platform: PlatformService,
                    explorer: ExplorerService,
                    modal: ModalService
                });
                const result = await service.modal.showForm<{ name: TextFormGroup }>({
                    title: 'Add Endpoint',
                    form: {
                        name: {
                            type: 'text',
                            label: 'Name'
                        }
                    }
                });
                if (!result) return;
                const endpoint: DrxApiEndpoint = {
                    id: $Id.guid(),
                    name: result.name,
                    path: '/',
                    method: 'GET',
                    parameterIds: [],
                    headerIds: []
                };
                service.platform.drx.state.reduce(reducer => [
                    reducer.apiEndpoints.entity.create(endpoint),
                    reducer.apis.entity.updateById(apiId, api => ({ endpointIds: [...api.endpointIds, endpoint.id] }))
                ]);
                service.explorer.selectItem({ type: ExplorerNode.ApiEndpoint, id: endpoint.id, apiId });
            }
        },
        {
            icon: 'pencil',
            text: 'Rename',
            onClick: async () => {
                const service = useInjector({
                    platform: PlatformService,
                    modal: ModalService
                });
                const result = await service.modal.showForm<{ name: TextFormGroup }>({
                    title: 'Rename Api',
                    form: {
                        name: {
                            type: 'text',
                            label: 'Name',
                            value: apiName
                        }
                    }
                });
                if (!result) return;
                service.platform.drx.state.reduce(reducer => [
                    reducer.apis.entity.updateById(apiId, { name: result.name })
                ]);
            }
        },
        {
            icon: 'trash',
            text: 'Delete',
            onClick: async () => {
                const service = useInjector({
                    platform: PlatformService,
                    explorer: ExplorerService,
                    modal: ModalService
                });
                const confirmed = await service.modal.showConfirm('Delete', `Are you sure you want to delete "${apiName}"?`);
                if (!confirmed) return;
                const api = service.platform.drx.state.value.apis[apiId];
                service.platform.drx.state.reduce(reducer => [
                    reducer.apis.entity.delete(apiId),
                    reducer.types.entity.delete(...api.typeIds),
                    reducer.app.value.update(app => ({ apiIds: app.apiIds.filter(id => id !== apiId) }))
                ]);
                const selected = service.explorer.state.value.selectedItem;
                if (selected?.type === ExplorerNode.Api && selected.id === apiId) {
                    service.explorer.state.update({ selectedItem: undefined });
                }
            }
        }
    ];
}
