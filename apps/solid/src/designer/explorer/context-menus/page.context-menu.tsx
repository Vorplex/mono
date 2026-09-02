import { $Id, State } from '@vorplex/core';
import { ShtmlPage } from '@vorplex/shtml';
import { useInjector } from '@vorplex/solid';
import { TextFormGroup } from '../../../components/forms/form-input.component';
import { ContextMenuItem } from '../../../directives/context-menu.directive';
import { ModalService } from '../../../services/modal.service';
import { PlatformService } from '../../../services/platform.service';
import { ExplorerNode, ExplorerService } from '../explorer.service';

export const PageContextMenu: ContextMenuItem[] = [
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
                title: 'Add Page',
                form: new State({
                    name: {
                        type: 'text',
                        label: 'Name'
                    }
                })
            });
            if (!result) return;
            const page: ShtmlPage = {
                id: $Id.guid(),
                name: result.name,
                variableIds: [],
                template: []
            };
            service.platform.shtml.state.reduce(reducer => [
                reducer.pages.entity.create(page),
                reducer.app.value.update(app => ({ pageIds: [...app.pageIds, page.id] }))
            ]);
            service.explorer.selectItem({ type: ExplorerNode.Page, id: page.id });
        }
    }
];

export function createPageItemContextMenu(pageId: string, pageName: string): ContextMenuItem[] {
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
                    title: 'Rename Page',
                    form: {
                        name: {
                            type: 'text',
                            label: 'Name',
                            value: pageName
                        }
                    }
                });
                if (!result) return;
                service.platform.shtml.state.reduce(reducer => [
                    reducer.pages.entity.updateById(pageId, { name: result.name })
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
                const confirmed = await service.modal.showConfirm('Delete', `Are you sure you want to delete "${pageName}"?`);
                if (!confirmed) return;
                service.platform.shtml.state.reduce(reducer => [
                    reducer.pages.entity.delete(pageId),
                    reducer.app.value.update(app => ({ pageIds: app.pageIds.filter(id => id !== pageId) }))
                ]);
                const selected = service.explorer.state.value.selectedItem;
                if (selected?.type === ExplorerNode.Page && selected.id === pageId) {
                    service.explorer.state.update({ selectedItem: undefined });
                }
            }
        }
    ];
}
