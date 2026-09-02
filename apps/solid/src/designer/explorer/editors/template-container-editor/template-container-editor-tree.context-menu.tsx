import { $Id } from '@vorplex/core';
import { NodeType, ShtmlComponentInstance, ShtmlElement, ShtmlFor, ShtmlIcon, ShtmlIf, ShtmlPageContainer, ShtmlTemplateItem, ShtmlTemplateTargetType } from '@vorplex/shtml';
import { useInjector } from '@vorplex/solid';
import { useContext } from 'solid-js';
import { ContextMenuItem } from '../../../../directives/context-menu.directive';
import { PlatformService } from '../../../../services/platform.service';
import { TemplateContainerEditorContext } from './template-container-editor-context';

const AddElementContextMenuItem = (targetType: ShtmlTemplateTargetType, targetId: string): ContextMenuItem => ({
    icon: 'code-xml',
    text: 'Add Element',
    onClick: () => {
        const service = useInjector({ platform: PlatformService });
        const node: ShtmlElement = { id: $Id.guid(), type: NodeType.Element, tag: 'div', attributes: {}, template: [] };
        service.platform.shtml.addNode(targetType, targetId, node);
    }
});

const AddIfContextMenuItem = (targetType: ShtmlTemplateTargetType, targetId: string): ContextMenuItem => ({
    icon: 'git-branch',
    text: 'Add If',
    onClick: () => {
        const service = useInjector({ platform: PlatformService });
        const node: ShtmlIf = { id: $Id.guid(), type: NodeType.If, condition: 'true', template: [] };
        service.platform.shtml.addNode(targetType, targetId, node);
    }
});

const AddForContextMenuItem = (targetType: ShtmlTemplateTargetType, targetId: string): ContextMenuItem => ({
    icon: 'repeat',
    text: 'Add For',
    onClick: () => {
        const service = useInjector({ platform: PlatformService });
        const node: ShtmlFor = { id: $Id.guid(), type: NodeType.For, each: '[]', as: 'item', template: [] };
        service.platform.shtml.addNode(targetType, targetId, node);
    }
});

const AddComponentInstanceContextMenuItem = (targetType: ShtmlTemplateTargetType, targetId: string): ContextMenuItem => ({
    icon: 'cuboid',
    text: 'Add Component Instance',
    onClick: () => {
        const service = useInjector({ platform: PlatformService });
        const node: ShtmlComponentInstance = { id: $Id.guid(), type: NodeType.ComponentInstance, component: '', attributes: {} };
        service.platform.shtml.addNode(targetType, targetId, node);
    }
});

const AddPageContainerContextMenuItem = (targetType: ShtmlTemplateTargetType, targetId: string): ContextMenuItem => ({
    icon: 'monitor',
    text: 'Add Page Container',
    onClick: () => {
        const service = useInjector({ platform: PlatformService });
        const node: ShtmlPageContainer = { id: $Id.guid(), type: NodeType.PageContainer, page: '' };
        service.platform.shtml.addNode(targetType, targetId, node);
    }
});

const AddIconContextMenuItem = (targetType: ShtmlTemplateTargetType, targetId: string): ContextMenuItem => ({
    icon: 'shapes',
    text: 'Add Icon',
    onClick: () => {
        const service = useInjector({ platform: PlatformService });
        const node: ShtmlIcon = { id: $Id.guid(), type: NodeType.Icon, name: 'circle', attributes: {} };
        service.platform.shtml.addNode(targetType, targetId, node);
    }
});

const DeleteContextMenuItem = (node: ShtmlTemplateItem): ContextMenuItem => ({
    icon: 'trash',
    text: 'Delete',
    onClick: () => {
        const service = useInjector({ platform: PlatformService });
        const editorState = useContext(TemplateContainerEditorContext);
        const parent = service.platform.shtml.getNodeParent(node.id);
        if (!(parent?.type === NodeType.Page || parent?.type === NodeType.Component || parent?.type === NodeType.Element || parent?.type === NodeType.If || parent?.type === NodeType.For)) return;
        service.platform.shtml.removeNode(parent.type, parent.id, node);
        editorState.update(state => ({
            selectedTreeItem: state.selectedTreeItem?.id === node.id ? undefined : state.selectedTreeItem,
            hoveredTreeItem: state.hoveredTreeItem?.id === node.id ? undefined : state.hoveredTreeItem
        }));
    }
});

export const TemplateContainerTreeContextMenu = (targetType: ShtmlTemplateTargetType, targetId: string): ContextMenuItem[] => [
    AddElementContextMenuItem(targetType, targetId),
    AddIfContextMenuItem(targetType, targetId),
    AddForContextMenuItem(targetType, targetId),
    AddComponentInstanceContextMenuItem(targetType, targetId),
    AddPageContainerContextMenuItem(targetType, targetId),
    AddIconContextMenuItem(targetType, targetId)
];

export const TextTreeItemContextMenu = (id: string): ContextMenuItem[] => [
    DeleteContextMenuItem({ id, type: NodeType.Text })
];

export const ElementTreeItemContextMenu = (id: string): ContextMenuItem[] => [
    AddElementContextMenuItem(NodeType.Element, id),
    AddIfContextMenuItem(NodeType.Element, id),
    AddForContextMenuItem(NodeType.Element, id),
    AddComponentInstanceContextMenuItem(NodeType.Element, id),
    AddPageContainerContextMenuItem(NodeType.Element, id),
    AddIconContextMenuItem(NodeType.Element, id),
    DeleteContextMenuItem({ id, type: NodeType.Element })
];

export const IfTreeItemContextMenu = (id: string): ContextMenuItem[] => [
    AddElementContextMenuItem(NodeType.If, id),
    AddIfContextMenuItem(NodeType.If, id),
    AddForContextMenuItem(NodeType.If, id),
    AddComponentInstanceContextMenuItem(NodeType.If, id),
    AddPageContainerContextMenuItem(NodeType.If, id),
    AddIconContextMenuItem(NodeType.If, id),
    DeleteContextMenuItem({ id, type: NodeType.If })
];

export const ForTreeItemContextMenu = (id: string): ContextMenuItem[] => [
    AddElementContextMenuItem(NodeType.For, id),
    AddIfContextMenuItem(NodeType.For, id),
    AddForContextMenuItem(NodeType.For, id),
    AddComponentInstanceContextMenuItem(NodeType.For, id),
    AddPageContainerContextMenuItem(NodeType.For, id),
    AddIconContextMenuItem(NodeType.For, id),
    DeleteContextMenuItem({ id, type: NodeType.For })
];

export const PageContainerTreeItemContextMenu = (id: string): ContextMenuItem[] => [
    DeleteContextMenuItem({ id, type: NodeType.PageContainer })
];

export const ComponentInstanceTreeItemContextMenu = (id: string): ContextMenuItem[] => [
    DeleteContextMenuItem({ id, type: NodeType.ComponentInstance })
];
