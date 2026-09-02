import { $Id, State } from '@vorplex/core';
import { ShtmlType } from '@vorplex/shtml';
import { useInjector } from '@vorplex/solid';
import { TextFormGroup } from '../../../components/forms/form-input.component';
import { ContextMenuItem } from '../../../directives/context-menu.directive';
import { ModalService } from '../../../services/modal.service';
import { PlatformService } from '../../../services/platform.service';
import { ExplorerNode, ExplorerService } from '../explorer.service';

export type TypeScope =
    | { type: 'app' }
    | { type: 'component'; componentId: string };

export function createTypeContextMenu(scope: TypeScope): ContextMenuItem[] {
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
                    title: 'Add Type',
                    form: new State({
                        name: {
                            type: 'text',
                            label: 'Name'
                        }
                    })
                });
                if (!result) return;
                const type: ShtmlType = {
                    id: $Id.guid(),
                    name: result.name,
                    type: { type: 'any' }
                };
                service.platform.shtml.state.reduce(reducer => {
                    const operations = [reducer.types.entity.create(type)];
                    switch (scope.type) {
                        case 'app':
                            operations.push(reducer.app.value.update(app => ({ typeIds: [...app.typeIds, type.id] })));
                            break;
                        case 'component':
                            operations.push(reducer.components.entity.updateById(scope.componentId, component => ({ typeIds: [...component.typeIds, type.id] })));
                            break;
                    }
                    return operations;
                });
                service.explorer.selectItem({ type: ExplorerNode.Type, id: type.id });
            }
        }
    ];
}

export function createTypeItemContextMenu(scope: TypeScope, typeId: string, typeName: string): ContextMenuItem[] {
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
                    title: 'Rename Type',
                    form: {
                        name: {
                            type: 'text',
                            label: 'Name',
                            value: typeName
                        }
                    }
                });
                if (!result) return;
                service.platform.shtml.state.reduce(reducer => [
                    reducer.types.entity.updateById(typeId, { name: result.name })
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
                const confirmed = await service.modal.showConfirm('Delete', `Are you sure you want to delete "${typeName}"?`);
                if (!confirmed) return;
                service.platform.shtml.state.reduce(reducer => {
                    const operations = [reducer.types.entity.delete(typeId)];
                    switch (scope.type) {
                        case 'app':
                            operations.push(reducer.app.value.update(app => ({ typeIds: app.typeIds.filter(id => id !== typeId) })));
                            break;
                        case 'component':
                            operations.push(reducer.components.entity.updateById(scope.componentId, component => ({ typeIds: component.typeIds.filter(id => id !== typeId) })));
                            break;
                    }
                    return operations;
                });
                const selected = service.explorer.state.value.selectedItem;
                if (selected?.type === ExplorerNode.Type && selected.id === typeId) {
                    service.explorer.state.update({ selectedItem: undefined });
                }
            }
        }
    ];
}
