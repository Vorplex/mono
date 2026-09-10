import { $Id, State } from '@vorplex/core';
import { DrxAsset } from '@vorplex/drx';
import { useInjector } from '@vorplex/solid';
import { TextFormGroup } from '../../../components/forms/form-input.component';
import { ContextMenuItem } from '../../../directives/context-menu.directive';
import { ModalService } from '../../../services/modal.service';
import { ExplorerNode, PlatformService } from '../../../services/platform.service';

export const AssetContextMenu: ContextMenuItem[] = [
    {
        icon: 'plus',
        text: 'Add',
        onClick: async () => {
            const service = useInjector({
                platform: PlatformService,
                modal: ModalService
            });
            const result = await service.modal.showForm<{ name: TextFormGroup }>({
                title: 'Add Asset',
                form: new State({
                    name: {
                        type: 'text',
                        label: 'Name'
                    }
                })
            });
            if (!result) return;
            const asset: DrxAsset = {
                id: $Id.guid(),
                name: result.name,
                source: { type: 'internal', content: '' }
            };
            service.platform.drx.state.reduce(reducer => [
                reducer.assets.entity.create(asset),
                reducer.app.value.update(app => ({
                    assetIds: [...app.assetIds, asset.id]
                }))
            ]);
            service.platform.state.set(state => state.explorer.selectedItem, { type: ExplorerNode.Asset, id: asset.id });
        }
    }
];

export function createAssetItemContextMenu(assetId: string, assetName: string): ContextMenuItem[] {
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
                    title: 'Rename Asset',
                    form: {
                        name: {
                            type: 'text',
                            label: 'Name',
                            value: assetName
                        }
                    }
                });
                if (!result) return;
                service.platform.drx.state.reduce(reducer => [
                    reducer.assets.entity.updateById(assetId, { name: result.name })
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
                const confirmed = await service.modal.showConfirm('Delete', `Are you sure you want to delete "${assetName}"?`);
                if (!confirmed) return;
                service.platform.drx.state.reduce(reducer => [
                    reducer.assets.entity.delete(assetId),
                    reducer.app.value.update(app => ({ assetIds: app.assetIds.filter(id => id !== assetId) }))
                ]);
                const selected = service.platform.state.value.explorer.selectedItem;
                if (selected?.type === ExplorerNode.Asset && selected.id === assetId) service.platform.state.set(state => state.explorer.selectedItem, undefined);
            }
        }
    ];
}
