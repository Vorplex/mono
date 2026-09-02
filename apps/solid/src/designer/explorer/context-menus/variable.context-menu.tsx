import { $Id, State } from '@vorplex/core';
import { ShtmlVariable } from '@vorplex/shtml';
import { useInjector } from '@vorplex/solid';
import { TextFormGroup } from '../../../components/forms/form-input.component';
import { ContextMenuItem } from '../../../directives/context-menu.directive';
import { ModalService } from '../../../services/modal.service';
import { PlatformService } from '../../../services/platform.service';
import { ExplorerNode, ExplorerService, VariableScope } from '../explorer.service';

export function createVariableContextMenu(scope: VariableScope): ContextMenuItem[] {
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
                    title: 'Add Variable',
                    form: new State({
                        name: {
                            type: 'text',
                            label: 'Name'
                        }
                    })
                });
                if (!result) return;
                const variable: ShtmlVariable = {
                    id: $Id.guid(),
                    name: result.name,
                    type: 'string'
                };
                service.platform.shtml.state.reduce(reducer => {
                    const operations = [reducer.variables.entity.create(variable)];
                    switch (scope.type) {
                        case 'app':
                            operations.push(reducer.app.value.update(app => ({ variableIds: [...app.variableIds, variable.id] })));
                            break;
                        case 'page':
                            operations.push(reducer.pages.entity.updateById(scope.pageId, page => ({ variableIds: [...page.variableIds, variable.id] })));
                            break;
                        case 'component':
                            operations.push(reducer.components.entity.updateById(scope.componentId, component => ({ variableIds: [...component.variableIds, variable.id] })));
                            break;
                    }
                    return operations;
                });
                service.explorer.selectItem({ type: ExplorerNode.Variable, id: variable.id, scope });
            }
        }
    ];
}

export function createVariableItemContextMenu(scope: VariableScope, variableId: string, variableName: string): ContextMenuItem[] {
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
                    title: 'Rename Variable',
                    form: {
                        name: {
                            type: 'text',
                            label: 'Name',
                            value: variableName
                        }
                    }
                });
                if (!result) return;
                service.platform.shtml.state.reduce(reducer => [
                    reducer.variables.entity.updateById(variableId, { name: result.name })
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
                const confirmed = await service.modal.showConfirm('Delete', `Are you sure you want to delete "${variableName}"?`);
                if (!confirmed) return;
                service.platform.shtml.state.reduce(reducer => {
                    const operations = [reducer.variables.entity.delete(variableId)];
                    switch (scope.type) {
                        case 'app':
                            operations.push(reducer.app.value.update(app => ({ variableIds: app.variableIds.filter(id => id !== variableId) })));
                            break;
                        case 'page':
                            operations.push(reducer.pages.entity.updateById(scope.pageId, page => ({ variableIds: page.variableIds.filter(id => id !== variableId) })));
                            break;
                        case 'component':
                            operations.push(reducer.components.entity.updateById(scope.componentId, component => ({ variableIds: component.variableIds.filter(id => id !== variableId) })));
                            break;
                    }
                    return operations;
                });
                const selected = service.explorer.state.value.selectedItem;
                if (selected?.type === ExplorerNode.Variable && selected.id === variableId) {
                    service.explorer.state.update({ selectedItem: undefined });
                }
            }
        }
    ];
}
