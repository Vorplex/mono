import { $Id, State } from '@vorplex/core';
import { ShtmlVariable } from '@vorplex/shtml';
import { useInjector } from '@vorplex/solid';
import { TextFormGroup } from '../../../components/forms/form-input.component';
import { ContextMenuItem } from '../../../directives/context-menu.directive';
import { ModalService } from '../../../services/modal.service';
import { PlatformService } from '../../../services/platform.service';
import { ExplorerNode, ExplorerService } from '../explorer.service';

export const VariableContextMenu: ContextMenuItem[] = [
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
            const variable: ShtmlVariable = {
                id: $Id.guid(),
                name: result.name,
                type: 'string'
            };
            service.platform.shtml.state.reduce(reducer => [
                reducer.variables.entity.create(variable),
                reducer.app.value.update(app => ({
                    variableIds: [...app.variableIds, variable.id]
                }))
            ]);
            service.explorer.selectItem(ExplorerNode.Variable, variable.id);
        }
    }
];
