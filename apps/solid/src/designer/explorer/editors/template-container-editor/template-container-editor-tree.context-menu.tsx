import { $Id, EmptyReducer, StateReducer } from '@vorplex/core';
import { DrxComponent, DrxComponentInstance, DrxDocumentState, DrxElement, DrxFor, DrxIcon, DrxIf, DrxPage, DrxPageContainer, DrxTemplateItem, DrxTemplateTargetType, DrxText, NodeType } from '@vorplex/drx';
import { useInjector } from '@vorplex/solid';
import { TextFormGroup } from '../../../../components/forms/form-input.component';
import { ContextMenuItem } from '../../../../directives/context-menu.directive';
import { ModalService } from '../../../../services/modal.service';
import { PlatformService, TemplateContainerTarget } from '../../../../services/platform.service';

const AddElementContextMenuItem = (targetType: DrxTemplateTargetType, targetId: string): ContextMenuItem => {
    const service = useInjector({ platform: PlatformService });
    return {
        icon: 'code-xml',
        text: 'Add Element',
        onClick: () => {
            const node: DrxElement = { id: $Id.guid(), type: NodeType.Element, tag: 'div', attributes: {}, template: [] };
            service.platform.drx.addNode(targetType, targetId, node);
        }
    };
};

const AddIfContextMenuItem = (targetType: DrxTemplateTargetType, targetId: string): ContextMenuItem => {
    const service = useInjector({ platform: PlatformService });
    return {
        icon: 'git-branch',
        text: 'Add If',
        onClick: () => {
            const node: DrxIf = { id: $Id.guid(), type: NodeType.If, condition: 'true', template: [] };
            service.platform.drx.addNode(targetType, targetId, node);
        }
    };
};

const AddForContextMenuItem = (targetType: DrxTemplateTargetType, targetId: string): ContextMenuItem => {
    const service = useInjector({ platform: PlatformService });
    return {
        icon: 'repeat',
        text: 'Add For',
        onClick: () => {
            const node: DrxFor = { id: $Id.guid(), type: NodeType.For, each: '[]', as: 'item', template: [] };
            service.platform.drx.addNode(targetType, targetId, node);
        }
    };
};

const AddTextContextMenuItem = (targetType: DrxTemplateTargetType, targetId: string): ContextMenuItem => {
    const service = useInjector({ platform: PlatformService });
    return {
        icon: 'type',
        text: 'Add Text',
        onClick: () => {
            const node: DrxText = { id: $Id.guid(), type: NodeType.Text, content: '' };
            service.platform.drx.addNode(targetType, targetId, node);
        }
    };
};

const AddComponentInstanceContextMenuItem = (targetType: DrxTemplateTargetType, targetId: string): ContextMenuItem => {
    const service = useInjector({ platform: PlatformService });
    return {
        icon: 'cuboid',
        text: 'Add Component Instance',
        onClick: () => {
            const node: DrxComponentInstance = { id: $Id.guid(), type: NodeType.ComponentInstance, component: '', attributes: {} };
            service.platform.drx.addNode(targetType, targetId, node);
        }
    };
};

const AddPageContainerContextMenuItem = (targetType: DrxTemplateTargetType, targetId: string): ContextMenuItem => {
    const service = useInjector({ platform: PlatformService });
    return {
        icon: 'monitor',
        text: 'Add Page Container',
        onClick: () => {
            const node: DrxPageContainer = { id: $Id.guid(), type: NodeType.PageContainer, page: '' };
            service.platform.drx.addNode(targetType, targetId, node);
        }
    };
};

const AddIconContextMenuItem = (targetType: DrxTemplateTargetType, targetId: string): ContextMenuItem => {
    const service = useInjector({ platform: PlatformService });
    return {
        icon: 'shapes',
        text: 'Add Icon',
        onClick: () => {
            const node: DrxIcon = { id: $Id.guid(), type: NodeType.Icon, name: 'circle', attributes: {} };
            service.platform.drx.addNode(targetType, targetId, node);
        }
    };
};

const DeleteContextMenuItem = (target: TemplateContainerTarget, node: DrxTemplateItem): ContextMenuItem => {
    const service = useInjector({ platform: PlatformService });
    return {
        icon: 'trash',
        text: 'Delete',
        onClick: () => {
            const parent = service.platform.drx.getNodeParent(node.id);
            if (!(parent?.type === NodeType.Page || parent?.type === NodeType.Component || parent?.type === NodeType.Element || parent?.type === NodeType.If || parent?.type === NodeType.For)) return;
            service.platform.drx.removeNode(parent.type, parent.id, node);
            service.platform.state.update(state => state.explorer.templateEditors[target.id], editor => ({
                selectedTreeItem: editor.selectedTreeItem?.id === node.id ? undefined : editor.selectedTreeItem,
                hoveredTreeItem: editor.hoveredTreeItem?.id === node.id ? undefined : editor.hoveredTreeItem
            }));
        }
    };
};

function replaceTemplateItem(parent: { type: NodeType; id: string }, itemId: string, replacement: DrxTemplateItem) {
    return (reducer: StateReducer<DrxDocumentState, EmptyReducer>) => {
        switch (parent.type) {
            case NodeType.Page: return reducer.pages.entity.updateById(parent.id, (page: DrxPage) => ({ template: page.template.map(item => item.id === itemId ? replacement : item) }));
            case NodeType.Component: return reducer.components.entity.updateById(parent.id, (component: DrxComponent) => ({ template: component.template.map(item => item.id === itemId ? replacement : item) }));
            case NodeType.Element: return reducer.elements.entity.updateById(parent.id, (element: DrxElement) => ({ template: element.template.map(item => item.id === itemId ? replacement : item) }));
            case NodeType.If: return reducer.ifs.entity.updateById(parent.id, (item: DrxIf) => ({ template: item.template.map(entry => entry.id === itemId ? replacement : entry) }));
            case NodeType.For: return reducer.fors.entity.updateById(parent.id, (item: DrxFor) => ({ template: item.template.map(entry => entry.id === itemId ? replacement : entry) }));
            default: return {};
        }
    };
}

const ConvertToComponentContextMenuItem = (elementId: string): ContextMenuItem => {
    const service = useInjector({ platform: PlatformService, modal: ModalService });
    return {
        icon: 'component',
        text: 'Convert to Component',
        onClick: async () => {
            const parent = service.platform.drx.getNodeParent(elementId);
            if (!parent || parent.type === NodeType.Component) return;
            const result = await service.modal.showForm<{ name: TextFormGroup }>({
                title: 'Convert to Component',
                form: {
                    name: {
                        type: 'text',
                        label: 'Name',
                        autoFocus: true,
                        validate: value => ({ error: value ? undefined : 'Required' })
                    }
                }
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
                template: [{ id: elementId, type: NodeType.Element }]
            };
            const instance: DrxComponentInstance = {
                id: $Id.guid(),
                type: NodeType.ComponentInstance,
                component: component.name,
                attributes: {}
            };
            service.platform.drx.state.reduce(reducer => [
                reducer.components.entity.create(component),
                reducer.app.value.update(app => ({ componentIds: [...app.componentIds, component.id] })),
                reducer.componentInstances.entity.create(instance),
                replaceTemplateItem(parent, elementId, { id: instance.id, type: NodeType.ComponentInstance })(reducer)
            ]);
        }
    };
};

const ConvertToPageContextMenuItem = (elementId: string): ContextMenuItem => {
    const service = useInjector({ platform: PlatformService, modal: ModalService });
    return {
        icon: 'monitor',
        text: 'Convert to Page',
        onClick: async () => {
            const parent = service.platform.drx.getNodeParent(elementId);
            if (!parent || parent.type === NodeType.Component) return;
            const result = await service.modal.showForm<{ name: TextFormGroup }>({
                title: 'Convert to Page',
                form: {
                    name: {
                        type: 'text',
                        label: 'Name',
                        autoFocus: true,
                        validate: value => ({ error: value ? undefined : 'Required' })
                    }
                }
            });
            if (!result) return;
            const page: DrxPage = {
                id: $Id.guid(),
                name: result.name,
                variableIds: [],
                template: [{ id: elementId, type: NodeType.Element }]
            };
            const pageContainer: DrxPageContainer = {
                id: $Id.guid(),
                type: NodeType.PageContainer,
                page: page.name
            };
            service.platform.drx.state.reduce(reducer => [
                reducer.pages.entity.create(page),
                reducer.app.value.update(app => ({ pageIds: [...app.pageIds, page.id] })),
                reducer.pageContainers.entity.create(pageContainer),
                replaceTemplateItem(parent, elementId, { id: pageContainer.id, type: NodeType.PageContainer })(reducer)
            ]);
        }
    };
};

export const TemplateContainerTreeContextMenu = (targetType: DrxTemplateTargetType, targetId: string): ContextMenuItem[] => [
    AddElementContextMenuItem(targetType, targetId),
    AddTextContextMenuItem(targetType, targetId),
    AddIfContextMenuItem(targetType, targetId),
    AddForContextMenuItem(targetType, targetId),
    AddComponentInstanceContextMenuItem(targetType, targetId),
    AddPageContainerContextMenuItem(targetType, targetId),
    AddIconContextMenuItem(targetType, targetId)
];

export const TextTreeItemContextMenu = (target: TemplateContainerTarget, id: string): ContextMenuItem[] => [
    DeleteContextMenuItem(target, { id, type: NodeType.Text })
];

export const ElementTreeItemContextMenu = (target: TemplateContainerTarget, id: string): ContextMenuItem[] => [
    AddElementContextMenuItem(NodeType.Element, id),
    AddTextContextMenuItem(NodeType.Element, id),
    AddIfContextMenuItem(NodeType.Element, id),
    AddForContextMenuItem(NodeType.Element, id),
    AddComponentInstanceContextMenuItem(NodeType.Element, id),
    AddPageContainerContextMenuItem(NodeType.Element, id),
    AddIconContextMenuItem(NodeType.Element, id),
    ConvertToComponentContextMenuItem(id),
    ConvertToPageContextMenuItem(id),
    DeleteContextMenuItem(target, { id, type: NodeType.Element })
];

export const IfTreeItemContextMenu = (target: TemplateContainerTarget, id: string): ContextMenuItem[] => [
    AddElementContextMenuItem(NodeType.If, id),
    AddTextContextMenuItem(NodeType.If, id),
    AddIfContextMenuItem(NodeType.If, id),
    AddForContextMenuItem(NodeType.If, id),
    AddComponentInstanceContextMenuItem(NodeType.If, id),
    AddPageContainerContextMenuItem(NodeType.If, id),
    AddIconContextMenuItem(NodeType.If, id),
    DeleteContextMenuItem(target, { id, type: NodeType.If })
];

export const ForTreeItemContextMenu = (target: TemplateContainerTarget, id: string): ContextMenuItem[] => [
    AddElementContextMenuItem(NodeType.For, id),
    AddTextContextMenuItem(NodeType.For, id),
    AddIfContextMenuItem(NodeType.For, id),
    AddForContextMenuItem(NodeType.For, id),
    AddComponentInstanceContextMenuItem(NodeType.For, id),
    AddPageContainerContextMenuItem(NodeType.For, id),
    AddIconContextMenuItem(NodeType.For, id),
    DeleteContextMenuItem(target, { id, type: NodeType.For })
];

export const PageContainerTreeItemContextMenu = (target: TemplateContainerTarget, id: string): ContextMenuItem[] => [
    DeleteContextMenuItem(target, { id, type: NodeType.PageContainer })
];

export const ComponentInstanceTreeItemContextMenu = (target: TemplateContainerTarget, id: string): ContextMenuItem[] => [
    DeleteContextMenuItem(target, { id, type: NodeType.ComponentInstance })
];
