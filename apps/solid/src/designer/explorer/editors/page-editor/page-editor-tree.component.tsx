import { $Array } from '@vorplex/core';
import { ExpressionDisplay, NodeType, ShtmlTemplateItem } from '@vorplex/shtml';
import { createStyle, defineComponent, useCachedSignal, useInjector, useStore } from '@vorplex/solid';
import { classNames } from '@vorplex/web';
import { createMemo, Show, type JSX } from 'solid-js';
import { Icon } from '../../../../components/icon.component';
import { VirtualList, type VirtualListItem } from '../../../../components/virtual-list.component';
import { Theme } from '../../../../consts/theme';
import { PlatformService } from '../../../../services/platform.service';
import { PageEditorService } from './page-editor.service';

const classes = createStyle(() => ({
    tree: {
        background: Theme().secondary.color,
        color: Theme().secondary.text
    },
    item: {
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        padding: '5px 10px',
        '&.selected': {
            boxShadow: Theme().hoverShadow,
        },
        '&.hovered': {
            boxShadow: Theme().hoverShadow,
        },
        '&:hover': {
            cursor: 'pointer',
            boxShadow: Theme().hoverShadow,
        }
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

const PageEditorTreeCollapsedItemsCacheKey = Symbol();

export const PageEditorTreeComponent = defineComponent((props: { pageId: string }) => {

    const service = useInjector({
        platform: PlatformService,
        pageEditor: PageEditorService
    });

    const pageEditor = useStore(service.pageEditor.state);
    const shtml = useStore(service.platform.shtml.state);
    const page = createMemo(() => shtml.pages[props.pageId]);

    const [collapsedItems, setCollapsedItems] = useCachedSignal(PageEditorTreeCollapsedItemsCacheKey, []);
    const items = createMemo(() => {
        const template = page()?.template();
        if (!Array.isArray(template)) return [];
        const items: VirtualListItem[] = [];
        const traverse = (template: ShtmlTemplateItem[], depth: number = 0) => {
            for (const item of template) {
                switch (item.kind) {
                    case NodeType.Text:
                        items.push({ key: item.id, content: () => <TextItem id={item.id} depth={depth} /> });
                        break;
                    case NodeType.Element:
                        items.push({ key: item.id, content: () => <ElementItem id={item.id} depth={depth} /> });
                        break;
                    case NodeType.If:
                        items.push({ key: item.id, content: () => <IfItem id={item.id} depth={depth} /> });
                        break;
                    case NodeType.For:
                        items.push({ key: item.id, content: () => <ForItem id={item.id} depth={depth} /> });
                        break;
                    case NodeType.PageContainer:
                        items.push({ key: item.id, content: () => <PageContainerItem id={item.id} depth={depth} /> });
                        break;
                    case NodeType.ComponentInstance:
                        items.push({ key: item.id, content: () => <ComponentInstanceItem id={item.id} depth={depth} /> });
                        break;
                }
                if (collapsedItems().includes(item.id)) continue;
                if (item.kind === NodeType.Element) {
                    const template = shtml.elements[item.id].template();
                    const isLeaf = template.length === 1 && template[0].kind === NodeType.Text;
                    if (!isLeaf) traverse(template, depth + 1);
                } else if (item.kind === NodeType.If) {
                    traverse(shtml.ifs[item.id].template(), depth + 1);
                } else if (item.kind === NodeType.For) {
                    traverse(shtml.fors[item.id].template(), depth + 1);
                }
            }
        };
        traverse(template);
        return items;
    });

    const TreeItem = defineComponent((props: { id: string; type: NodeType; depth: number; expandable?: boolean; expanded?: boolean; onToggle?: () => void; label: JSX.Element }) => {
        return (
            <div
                class={classNames(classes().item, {
                    selected: pageEditor.selectedTreeItem.id() === props.id,
                    hovered: pageEditor.hoveredTreeItem.id() === props.id
                })}
                style={{ 'padding-left': `${10 + props.depth * 16}px` }}
                onClick={event => {
                    event.stopPropagation();
                    pageEditor.selectedTreeItem({ type: props.type, id: props.id });
                }}
                onMouseEnter={() => pageEditor.hoveredTreeItem({ type: props.type, id: props.id })}
                onMouseLeave={() => { if (pageEditor.hoveredTreeItem.id() === props.id) pageEditor.hoveredTreeItem(null); }}
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
    });

    const TextItem = defineComponent((props: { id: string; depth: number }) => {
        const node = shtml.texts[props.id];
        return (
            <Show when={node.id()}>
                <TreeItem id={node.id()} type={NodeType.Text} depth={props.depth} label={<>
                    <span>Text</span>
                    <span>{node.content()}</span>
                </>} />
            </Show>
        );
    });

    const ElementItem = defineComponent((props: { id: string; depth: number }) => {
        const node = shtml.elements[props.id];
        const expanded = createMemo(() => !collapsedItems().includes(props.id));
        const leaf = createMemo(() => {
            const template = node.template();
            if (template.length === 1 && template[0].kind === NodeType.Text) {
                return ExpressionDisplay.mask(shtml.texts[template[0].id].content());
            }
        });
        const expandable = createMemo(() => node.template().length > 0 && !leaf());
        return (
            <Show when={node.id()}>
                <TreeItem
                    id={node.id()} type={NodeType.Element} depth={props.depth}
                    expandable={expandable()} expanded={expanded()}
                    onToggle={() => setCollapsedItems(items => $Array.toggle(items, props.id))}
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
    });

    const IfItem = defineComponent((props: { id: string; depth: number }) => {
        const node = shtml.ifs[props.id];
        const expanded = createMemo(() => !collapsedItems().includes(props.id));
        const expandable = createMemo(() => node.template().length > 0);
        return (
            <Show when={node.id()}>
                <TreeItem
                    id={node.id()} type={NodeType.If} depth={props.depth}
                    expandable={expandable()} expanded={expanded()}
                    onToggle={() => setCollapsedItems(items => $Array.toggle(items, props.id))}
                    label={<>
                        <span>If</span>
                        <span style={{ color: Theme().secondary.subText }}>{ExpressionDisplay.mask(node.condition())}</span>
                    </>}
                />
            </Show>
        );
    });

    const ForItem = defineComponent((props: { id: string; depth: number }) => {
        const node = shtml.fors[props.id];
        const expanded = createMemo(() => !collapsedItems().includes(props.id));
        const expandable = createMemo(() => node.template().length > 0);
        return (
            <Show when={node.id()}>
                <TreeItem
                    id={node.id()} type={NodeType.For} depth={props.depth}
                    expandable={expandable()} expanded={expanded()}
                    onToggle={() => setCollapsedItems(items => $Array.toggle(items, props.id))}
                    label={<>
                        <span>For</span>
                        <span style={{ color: Theme().secondary.subText }}>{ExpressionDisplay.mask(node.each())}</span>
                        <span>as</span>
                        <span style={{ color: Theme().secondary.subText }}>{node.as()}</span>
                    </>}
                />
            </Show>
        );
    });

    const PageContainerItem = defineComponent((props: { id: string; depth: number }) => {
        const node = shtml.pageContainers[props.id];
        return (
            <Show when={node.id()}>
                <TreeItem id={node.id()} type={NodeType.PageContainer} depth={props.depth} label={<>
                    <span>Page</span>
                    <span>{node.page()}</span>
                </>} />
            </Show>
        );
    });

    const ComponentInstanceItem = defineComponent((props: { id: string; depth: number }) => {
        const node = shtml.componentInstances[props.id];
        return (
            <Show when={node.id()}>
                <TreeItem id={node.id()} type={NodeType.ComponentInstance} depth={props.depth} label={<>
                    <span>Component</span>
                    <span>{node.component()}</span>
                </>} />
            </Show>
        );
    });

    return (
        <div
            class={classes().tree}
            onClick={() => pageEditor.selectedTreeItem(null)}
        >
            <Show when={page()}>
                <VirtualList items={items()} />
            </Show>
        </div>
    );
});
