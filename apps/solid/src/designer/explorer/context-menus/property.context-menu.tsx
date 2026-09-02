import { $Id } from '@vorplex/core';
import { ShtmlComponentProperty } from '@vorplex/shtml';
import { useInjector } from '@vorplex/solid';
import { TextFormGroup } from '../../../components/forms/form-input.component';
import { ContextMenuItem } from '../../../directives/context-menu.directive';
import { ModalService } from '../../../services/modal.service';
import { PlatformService } from '../../../services/platform.service';
import { ExplorerNode, ExplorerService } from '../explorer.service';

export function createPropertyContextMenu(componentId: string): ContextMenuItem[] {
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
                    title: 'Add Property',
                    form: {
                        name: {
                            type: 'text',
                            label: 'Name'
                        }
                    }
                });
                if (!result) return;
                const property: ShtmlComponentProperty = {
                    id: $Id.guid(),
                    name: result.name,
                    type: 'any'
                };
                service.platform.shtml.state.reduce(reducer => [
                    reducer.componentProperties.entity.create(property),
                    reducer.components.entity.updateById(componentId, component => ({ propertyIds: [...component.propertyIds, property.id] }))
                ]);
                service.explorer.selectItem({ type: ExplorerNode.ComponentProperty, id: property.id, componentId });
            }
        }
    ];
}

export function createPropertyItemContextMenu(componentId: string, propertyId: string, propertyName: string): ContextMenuItem[] {
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
                    title: 'Rename Property',
                    form: {
                        name: {
                            type: 'text',
                            label: 'Name',
                            value: propertyName
                        }
                    }
                });
                if (!result) return;
                service.platform.shtml.state.reduce(reducer => [
                    reducer.componentProperties.entity.updateById(propertyId, { name: result.name })
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
                const confirmed = await service.modal.showConfirm('Delete', `Are you sure you want to delete "${propertyName}"?`);
                if (!confirmed) return;
                service.platform.shtml.state.reduce(reducer => [
                    reducer.componentProperties.entity.delete(propertyId),
                    reducer.components.entity.updateById(componentId, component => ({ propertyIds: component.propertyIds.filter(id => id !== propertyId) }))
                ]);
                const selected = service.explorer.state.value.selectedItem;
                if (selected?.type === ExplorerNode.ComponentProperty && selected.id === propertyId) {
                    service.explorer.state.update({ selectedItem: undefined });
                }
            }
        }
    ];
}
