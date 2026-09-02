import { $Id, State } from '@vorplex/core';
import { ShtmlService } from '@vorplex/shtml';
import { useInjector } from '@vorplex/solid';
import { TextFormGroup } from '../../../components/forms/form-input.component';
import { ContextMenuItem } from '../../../directives/context-menu.directive';
import { ModalService } from '../../../services/modal.service';
import { PlatformService } from '../../../services/platform.service';
import { ExplorerNode, ExplorerService } from '../explorer.service';

export type ServiceScope =
    | { type: 'app' }
    | { type: 'component'; componentId: string };

export function createServiceContextMenu(scope: ServiceScope): ContextMenuItem[] {
    return [
        {
            icon: 'plus',
            text: 'Add',
            onClick: async () => {
                const service = useInjector({
                    platform: PlatformService,
                    explorer: ExplorerService,
                    modal: ModalService
                });
                const result = await service.modal.showForm<{ name: TextFormGroup }>({
                    title: 'Add Service',
                    form: new State({
                        name: {
                            type: 'text',
                            label: 'Name'
                        }
                    })
                });
                if (!result) return;
                const newService: ShtmlService = {
                    id: $Id.guid(),
                    name: result.name,
                    script: ''
                };
                service.platform.shtml.state.reduce(reducer => {
                    const operations = [reducer.services.entity.create(newService)];
                    switch (scope.type) {
                        case 'app':
                            operations.push(reducer.app.value.update(app => ({ serviceIds: [...app.serviceIds, newService.id] })));
                            break;
                        case 'component':
                            operations.push(reducer.components.entity.updateById(scope.componentId, component => ({ serviceIds: [...component.serviceIds, newService.id] })));
                            break;
                    }
                    return operations;
                });
                service.explorer.selectItem({ type: ExplorerNode.Service, id: newService.id });
            }
        }
    ];
}

export function createServiceItemContextMenu(scope: ServiceScope, serviceId: string, serviceName: string): ContextMenuItem[] {
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
                    title: 'Rename Service',
                    form: {
                        name: {
                            type: 'text',
                            label: 'Name',
                            value: serviceName
                        }
                    }
                });
                if (!result) return;
                service.platform.shtml.state.reduce(reducer => [
                    reducer.services.entity.updateById(serviceId, { name: result.name })
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
                const confirmed = await service.modal.showConfirm('Delete', `Are you sure you want to delete "${serviceName}"?`);
                if (!confirmed) return;
                service.platform.shtml.state.reduce(reducer => {
                    const operations = [reducer.services.entity.delete(serviceId)];
                    switch (scope.type) {
                        case 'app':
                            operations.push(reducer.app.value.update(app => ({ serviceIds: app.serviceIds.filter(id => id !== serviceId) })));
                            break;
                        case 'component':
                            operations.push(reducer.components.entity.updateById(scope.componentId, component => ({ serviceIds: component.serviceIds.filter(id => id !== serviceId) })));
                            break;
                    }
                    return operations;
                });
                const selected = service.explorer.state.value.selectedItem;
                if (selected?.type === ExplorerNode.Service && selected.id === serviceId) {
                    service.explorer.state.update({ selectedItem: undefined });
                }
            }
        }
    ];
}
