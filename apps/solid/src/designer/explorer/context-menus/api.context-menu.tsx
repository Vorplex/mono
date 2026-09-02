import { $Id, $String } from '@vorplex/core';
import { ShtmlApi, ShtmlApiEndpoint } from '@vorplex/shtml';
import { useInjector } from '@vorplex/solid';
import { TextFormGroup } from '../../../components/forms/form-input.component';
import { ContextMenuItem } from '../../../directives/context-menu.directive';
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
            const api: ShtmlApi = {
                id: $Id.guid(),
                name: result.name,
                url: result.url,
                endpointIds: []
            };
            service.platform.shtml.state.reduce(reducer => [
                reducer.apis.entity.create(api),
                reducer.app.value.update(app => ({ apiIds: [...app.apiIds, api.id] }))
            ]);
            service.explorer.selectItem({ type: ExplorerNode.Api, id: api.id });
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
                const endpoint: ShtmlApiEndpoint = {
                    id: $Id.guid(),
                    name: result.name,
                    path: '/',
                    method: 'GET',
                    parameterIds: [],
                    headerIds: []
                };
                service.platform.shtml.state.reduce(reducer => [
                    reducer.apiEndpoints.entity.create(endpoint),
                    reducer.apis.entity.updateById(apiId, api => ({ endpointIds: [...api.endpointIds, endpoint.id] }))
                ]);
                service.explorer.selectItem({ type: ExplorerNode.ApiEndpoint, id: endpoint.id });
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
                service.platform.shtml.state.reduce(reducer => [
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
                service.platform.shtml.state.reduce(reducer => [
                    reducer.apis.entity.delete(apiId),
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
