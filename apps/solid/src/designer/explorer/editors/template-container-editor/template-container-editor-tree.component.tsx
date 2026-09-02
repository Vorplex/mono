import { $Array } from '@vorplex/core';
import { ExpressionDisplay, NodeType, ShtmlTemplateItem } from '@vorplex/shtml';
import { createStyle, useCachedSignal, useInjector, useStore } from '@vorplex/solid';
import { classNames } from '@vorplex/web';
import { createMemo, Show, useContext, type JSX } from 'solid-js';
import { Icon } from '../../../../components/icon.component';
import { PanelComponent } from '../../../../components/panel.component';
import { VirtualList, type VirtualListItem } from '../../../../components/virtual-list.component';
import { Theme } from '../../../../consts/theme';
import { ContextMenuItem } from '../../../../directives/context-menu.directive';
import { PlatformService } from '../../../../services/platform.service';
import { TemplateContainerEditorContext, TemplateContainerTarget } from './template-container-editor-context';
import {
    ComponentInstanceTreeItemContextMenu,
    ElementTreeItemContextMenu,
    ForTreeItemContextMenu,
    IfTreeItemContextMenu,
    PageContainerTreeItemContextMenu,
    TemplateContainerTreeContextMenu,
    TextTreeItemContextMenu
} from './template-container-editor-tree.context-menu';

const classes = createStyle(() => ({
    item: {
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        padding: '5px 10px',
        '&.descendant': {
            boxShadow: Theme().hoverShadow,
        },
        '&.hovered': {
            boxShadow: Theme().hoverShadow,
        },
        '&:hover': {
            cursor: 'pointer',
            boxShadow: Theme().hoverShadow,
        },
        '&.selected': {
            background: Theme().info.color,
            color: Theme().info.text,
        },
    },
    chevron: {
        color: Theme().secondary.subText,
        '&:hover': {
            color: Theme().secondary.text
        }
    },
    label: {
        display: 'flex',
        flex: '1 1 auto',
        gap: '5px',
        minWidth: '0',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis'
    }
}));

const TemplateContainerEditorTreeCollapsedItemsCacheKey = Symbol();

export function TemplateContainerEditorTreeComponent(props: { target: TemplateContainerTarget }) {

    const service = useInjector({
        platform: PlatformService
    });

    const editor = useStore(useContext(TemplateContainerEditorContext));
    const shtml = useStore(service.platform.shtml.state);
    const container = createMemo(() => props.target.type === 'component' ? shtml.components[props.target.id] : shtml.pages[props.target.id]);

    const [collapsedItems, setCollapsedItems] = useCachedSignal(TemplateContainerEditorTreeCollapsedItemsCacheKey, []);
    const items = createMemo(() => {
        const template = container()?.template();
        if (!Array.isArray(template)) return [];
        const items: VirtualListItem[] = [];
        const traverse = (template: ShtmlTemplateItem[], depth: number = 0, path: string[] = []) => {
            for (const item of template) {
                switch (item.type) {
                    case NodeType.Text:
                        items.push({ key: item.id, content: () => <TextItem id={item.id} depth={depth} path={path} /> });
                        break;
                    case NodeType.Element:
                        items.push({ key: item.id, content: () => <ElementItem id={item.id} depth={depth} path={path} /> });
                        break;
                    case NodeType.If:
                        items.push({ key: item.id, content: () => <IfItem id={item.id} depth={depth} path={path} /> });
                        break;
                    case NodeType.For:
                        items.push({ key: item.id, content: () => <ForItem id={item.id} depth={depth} path={path} /> });
                        break;
                    case NodeType.PageContainer:
                        items.push({ key: item.id, content: () => <PageContainerItem id={item.id} depth={depth} path={path} /> });
                        break;
                    case NodeType.ComponentInstance:
                        items.push({ key: item.id, content: () => <ComponentInstanceItem id={item.id} depth={depth} path={path} /> });
                        break;
                }
                if (collapsedItems().includes(item.id)) continue;
                const childPath = [...path, item.id];
                if (item.type === NodeType.Element) {
                    const template = shtml.elements[item.id].template();
                    const isLeaf = template.length === 1 && template[0].type === NodeType.Text;
                    if (!isLeaf) traverse(template, depth + 1, childPath);
                } else if (item.type === NodeType.If) {
                    traverse(shtml.ifs[item.id].template(), depth + 1, childPath);
                } else if (item.type === NodeType.For) {
                    traverse(shtml.fors[item.id].template(), depth + 1, childPath);
                }
            }
        };
        traverse(template);
        return items;
    });

    const TreeItem = (props: { id: string; type: NodeType; depth: number; path: string[]; expandable?: boolean; expanded?: boolean; onToggle?: () => void; label: JSX.Element; contextMenu?: ContextMenuItem[] }) => {
        const descendant = createMemo(() => {
            const selectedId = editor.selectedTreeItem.id();
            return selectedId != null && props.path.includes(selectedId);
        });
        return (
            <div
                class={classNames(classes().item, {
                    selected: editor.selectedTreeItem.id() === props.id,
                    descendant: descendant(),
                    hovered: editor.hoveredTreeItem.id() === props.id
                })}
                style={{ 'padding-left': `${10 + props.depth * 16}px` }}
                onClick={event => {
                    event.stopPropagation();
                    editor.selectedTreeItem({ type: props.type, id: props.id, path: props.path });
                }}
                onMouseEnter={() => editor.hoveredTreeItem({ type: props.type, id: props.id })}
                onMouseLeave={() => { if (editor.hoveredTreeItem.id() === props.id) editor.hoveredTreeItem(null); }}
                use:ContextMenuDirective={{ items: props.contextMenu ?? [] }}
            >
                <Show when={props.expandable}>
                    <Icon
                        name={props.expanded ? 'chevron-down' : 'chevron-right'}
                        class={classes().chevron}
                        onClick={event => {
                            event.stopPropagation();
                            props.onToggle?.();
                        }}
                    />
                </Show>
                <span class={classes().label}>{props.label}</span>
            </div>
        );
    };

    const TextItem = (props: { id: string; depth: number; path: string[] }) => {
        const node = shtml.texts[props.id];
        return (
            <Show when={node.id()}>
                <TreeItem
                    id={node.id()} type={NodeType.Text} depth={props.depth} path={props.path}
                    contextMenu={TextTreeItemContextMenu(node.id())}
                    label={<>
                        <span>Text</span>
                        <span>{node.content()}</span>
                    </>} />
            </Show>
        );
    };

    const ElementItem = (props: { id: string; depth: number; path: string[] }) => {
        const node = shtml.elements[props.id];
        const expanded = createMemo(() => !collapsedItems().includes(props.id));
        const leaf = createMemo(() => {
            const template = node.template();
            if (template.length === 1 && template[0].type === NodeType.Text) {
                return ExpressionDisplay.mask(shtml.texts[template[0].id].content());
            }
        });
        const expandable = createMemo(() => node.template().length > 0 && !leaf());
        return (
            <Show when={node.id()}>
                <TreeItem
                    id={node.id()} type={NodeType.Element} depth={props.depth} path={props.path}
                    expandable={expandable()} expanded={expanded()}
                    onToggle={() => setCollapsedItems(items => $Array.toggle(items, props.id))}
                    contextMenu={ElementTreeItemContextMenu(node.id())}
                    label={<>
                        <span>
                            <span style={{ color: Theme().accent.color }}>{node.tag()}</span>
                            <Show when={node.attributes.class()}>
                                <span style={{ color: Theme().secondary.subText }}>.</span>
                                <span style={{ color: Theme().success.outline }}>{node.attributes.class()}</span>
                            </Show>
                        </span>
                        <Show when={leaf()}>
                            <span style={{ color: Theme().secondary.subText }}>"{leaf()}"</span>
                        </Show>
                    </>}
                />
            </Show>
        );
    };

    const IfItem = (props: { id: string; depth: number; path: string[] }) => {
        const node = shtml.ifs[props.id];
        const expanded = createMemo(() => !collapsedItems().includes(props.id));
        const expandable = createMemo(() => node.template().length > 0);
        return (
            <Show when={node.id()}>
                <TreeItem
                    id={node.id()} type={NodeType.If} depth={props.depth} path={props.path}
                    expandable={expandable()} expanded={expanded()}
                    onToggle={() => setCollapsedItems(items => $Array.toggle(items, props.id))}
                    contextMenu={IfTreeItemContextMenu(node.id())}
                    label={<>
                        <span>If</span>
                        <span style={{ color: Theme().secondary.subText }}>{ExpressionDisplay.mask(node.condition())}</span>
                    </>}
                />
            </Show>
        );
    };

    const ForItem = (props: { id: string; depth: number; path: string[] }) => {
        const node = shtml.fors[props.id];
        const expanded = createMemo(() => !collapsedItems().includes(props.id));
        const expandable = createMemo(() => node.template().length > 0);
        return (
            <Show when={node.id()}>
                <TreeItem
                    id={node.id()} type={NodeType.For} depth={props.depth} path={props.path}
                    expandable={expandable()} expanded={expanded()}
                    onToggle={() => setCollapsedItems(items => $Array.toggle(items, props.id))}
                    contextMenu={ForTreeItemContextMenu(node.id())}
                    label={<>
                        <span>For</span>
                        <span style={{ color: Theme().secondary.subText }}>{ExpressionDisplay.mask(node.each())}</span>
                        <span>as</span>
                        <span style={{ color: Theme().secondary.subText }}>{node.as()}</span>
                    </>}
                />
            </Show>
        );
    };

    const PageContainerItem = (props: { id: string; depth: number; path: string[] }) => {
        const node = shtml.pageContainers[props.id];
        return (
            <Show when={node.id()}>
                <TreeItem
                    id={node.id()} type={NodeType.PageContainer} depth={props.depth} path={props.path}
                    contextMenu={PageContainerTreeItemContextMenu(node.id())}
                    label={<>
                        <span>Page</span>
                        <span>{node.page()}</span>
                    </>} />
            </Show>
        );
    };

    const ComponentInstanceItem = (props: { id: string; depth: number; path: string[] }) => {
        const node = shtml.componentInstances[props.id];
        return (
            <Show when={node.id()}>
                <TreeItem
                    id={node.id()} type={NodeType.ComponentInstance} depth={props.depth} path={props.path}
                    contextMenu={ComponentInstanceTreeItemContextMenu(node.id())}
                    label={<>
                        <span>Component</span>
                        <span>{node.component()}</span>
                    </>} />
            </Show>
        );
    };

    return (
        <Show when={container()}>
            <div
                style={{ height: '100%' }}
                onClick={() => editor.selectedTreeItem(null)}
                use:ContextMenuDirective={{ items: TemplateContainerTreeContextMenu(props.target.type === 'component' ? NodeType.Component : NodeType.Page, props.target.id) }}
            >
                <PanelComponent icon='list-tree' title='Nodes'>
                    <VirtualList items={items()} />
                </PanelComponent>
            </div>
        </Show>
    );
}
