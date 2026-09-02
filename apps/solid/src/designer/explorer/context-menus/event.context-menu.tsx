import { $Id } from '@vorplex/core';
import { ShtmlComponentEvent } from '@vorplex/shtml';
import { useInjector } from '@vorplex/solid';
import { TextFormGroup } from '../../../components/forms/form-input.component';
import { ContextMenuItem } from '../../../directives/context-menu.directive';
import { ModalService } from '../../../services/modal.service';
import { PlatformService } from '../../../services/platform.service';
import { ExplorerNode, ExplorerService } from '../explorer.service';

export function createEventContextMenu(componentId: string): ContextMenuItem[] {
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
                    title: 'Add Event',
                    form: {
                        name: {
                            type: 'text',
                            label: 'Name'
                        }
                    }
                });
                if (!result) return;
                const event: ShtmlComponentEvent = {
                    id: $Id.guid(),
                    name: result.name,
                    type: 'any'
                };
                service.platform.shtml.state.reduce(reducer => [
                    reducer.componentEvents.entity.create(event),
                    reducer.components.entity.updateById(componentId, component => ({ eventIds: [...component.eventIds, event.id] }))
                ]);
                service.explorer.selectItem({ type: ExplorerNode.ComponentEvent, id: event.id, componentId });
            }
        }
    ];
}

export function createEventItemContextMenu(componentId: string, eventId: string, eventName: string): ContextMenuItem[] {
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
                    title: 'Rename Event',
                    form: {
                        name: {
                            type: 'text',
                            label: 'Name',
                            value: eventName
                        }
                    }
                });
                if (!result) return;
                service.platform.shtml.state.reduce(reducer => [
                    reducer.componentEvents.entity.updateById(eventId, { name: result.name })
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
                const confirmed = await service.modal.showConfirm('Delete', `Are you sure you want to delete "${eventName}"?`);
                if (!confirmed) return;
                service.platform.shtml.state.reduce(reducer => [
                    reducer.componentEvents.entity.delete(eventId),
                    reducer.components.entity.updateById(componentId, component => ({ eventIds: component.eventIds.filter(id => id !== eventId) }))
                ]);
                const selected = service.explorer.state.value.selectedItem;
                if (selected?.type === ExplorerNode.ComponentEvent && selected.id === eventId) {
                    service.explorer.state.update({ selectedItem: undefined });
                }
            }
        }
    ];
}
