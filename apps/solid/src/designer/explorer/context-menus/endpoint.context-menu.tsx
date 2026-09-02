import { useInjector } from '@vorplex/solid';
import { TextFormGroup } from '../../../components/forms/form-input.component';
import { ContextMenuItem } from '../../../directives/context-menu.directive';
import { ModalService } from '../../../services/modal.service';
import { PlatformService } from '../../../services/platform.service';
import { ExplorerNode, ExplorerService } from '../explorer.service';

export function createEndpointItemContextMenu(apiId: string, endpointId: string, endpointName: string): ContextMenuItem[] {
    return [
        {
            icon: 'pencil',
            text: 'Rename',
            onClick: async () => {
                const service = useInjector({
                    platform: PlatformService,
                    modal: ModalService
                });
                const result = await service.modal.showForm<{ name: TextFormGroup }>({
                    title: 'Rename Endpoint',
                    form: {
                        name: {
                            type: 'text',
                            label: 'Name',
                            value: endpointName
                        }
                    }
                });
                if (!result) return;
                service.platform.shtml.state.reduce(reducer => [
                    reducer.apiEndpoints.entity.updateById(endpointId, { name: result.name })
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
                const confirmed = await service.modal.showConfirm('Delete', `Are you sure you want to delete "${endpointName}"?`);
                if (!confirmed) return;
                service.platform.shtml.state.reduce(reducer => [
                    reducer.apiEndpoints.entity.delete(endpointId),
                    reducer.apis.entity.updateById(apiId, api => ({ endpointIds: api.endpointIds.filter(id => id !== endpointId) }))
                ]);
                const selected = service.explorer.state.value.selectedItem;
                if (selected?.type === ExplorerNode.ApiEndpoint && selected.id === endpointId) {
                    service.explorer.state.update({ selectedItem: undefined });
                }
            }
        }
    ];
}
