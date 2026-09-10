import { $Id, State } from '@vorplex/core';
import { DrxComponent } from '@vorplex/drx';
import { useInjector } from '@vorplex/solid';
import { TextFormGroup } from '../../../components/forms/form-input.component';
import { ContextMenuItem } from '../../../directives/context-menu.directive';
import { ModalService } from '../../../services/modal.service';
import { ExplorerNode, PlatformService } from '../../../services/platform.service';

export type ComponentScope =
    | { type: 'app' }
    | { type: 'component'; componentId: string };

export function createComponentContextMenu(scope: ComponentScope): ContextMenuItem[] {
    return [
        {
            icon: 'plus',
            text: 'Add',
            onClick: async () => {
                const service = useInjector({
                    platform: PlatformService,
                    modal: ModalService
                });
                const result = await service.modal.showForm<{ name: TextFormGroup }>({
                    title: 'Add Component',
                    form: new State({
                        name: {
                            type: 'text',
                            label: 'Name'
                        }
                    })
                });
                if (!result) return;
                const component: DrxComponent = {
                    id: $Id.guid(),
                    name: result.name,
                    variableIds: [],
                    serviceIds: [],
                    assetIds: [],
                    typeIds: [],
                    componentIds: [],
                    propertyIds: [],
                    eventIds: [],
                    apiIds: [],
                    template: []
                };
                service.platform.drx.state.reduce(reducer => {
                    const operations = [reducer.components.entity.create(component)];
                    switch (scope.type) {
                        case 'app':
                            operations.push(reducer.app.value.update(app => ({ componentIds: [...app.componentIds, component.id] })));
                            break;
                        case 'component':
                            operations.push(reducer.components.entity.updateById(scope.componentId, parent => ({ componentIds: [...parent.componentIds, component.id] })));
                            break;
                    }
                    return operations;
                });
                service.platform.state.set(state => state.explorer.selectedItem, { type: ExplorerNode.Component, id: component.id });
            }
        }
    ];
}

export function createComponentItemContextMenu(scope: ComponentScope, componentId: string, componentName: string): ContextMenuItem[] {
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
                    title: 'Rename Component',
                    form: {
                        name: {
                            type: 'text',
                            label: 'Name',
                            value: componentName
                        }
                    }
                });
                if (!result) return;
                service.platform.drx.state.reduce(reducer => [
                    reducer.components.entity.updateById(componentId, { name: result.name })
                ]);
            }
        },
        {
            icon: 'trash',
            text: 'Delete',
            onClick: async () => {
                const service = useInjector({
                    platform: PlatformService,
                    modal: ModalService
                });
                const confirmed = await service.modal.showConfirm('Delete', `Are you sure you want to delete "${componentName}"?`);
                if (!confirmed) return;
                service.platform.drx.state.reduce(reducer => {
                    const operations = [reducer.components.entity.delete(componentId)];
                    switch (scope.type) {
                        case 'app':
                            operations.push(reducer.app.value.update(app => ({ componentIds: app.componentIds.filter(id => id !== componentId) })));
                            break;
                        case 'component':
                            operations.push(reducer.components.entity.updateById(scope.componentId, parent => ({ componentIds: parent.componentIds.filter(id => id !== componentId) })));
                            break;
                    }
                    return operations;
                });
                const selected = service.platform.state.value.explorer.selectedItem;
                if (selected?.type === ExplorerNode.Component && selected.id === componentId) service.platform.state.set(state => state.explorer.selectedItem, undefined);
            }
        }
    ];
}
