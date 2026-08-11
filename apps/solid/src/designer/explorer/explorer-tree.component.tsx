import { $Array } from '@vorplex/core';
import { createStyle, defineComponent, useCachedSignal, useInjector, useStore } from '@vorplex/solid';
import { classNames } from '@vorplex/web';
import { createMemo, For, Show, useContext, type JSX } from 'solid-js';
import { Icon } from '../../components/icon.component';
import { TreeViewContext } from '../../components/tree-view-item.component';
import { Theme } from '../../consts/theme';
import { ContextMenuItem } from '../../directives/context-menu.directive';
import { PlatformService } from '../../services/platform.service';
import { VariableContextMenu } from './context-menus/variable.context-menu';
import { ExplorerNode, ExplorerService } from './explorer.service';

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
        '&:hover': {
            cursor: 'pointer',
            boxShadow: Theme().hoverShadow,
        }
    },
    chevronSlot: {
        display: 'inline-flex',
        flex: '0 0 auto',
        width: '1em',
        height: '1em'
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

const ExplorerTreeExpandedItemsCacheKey = Symbol();

export function ExplorerTreeComponent() {

    const service = useInjector({
        platform: PlatformService,
        explorer: ExplorerService
    });

    const explorer = useStore(service.explorer.state);
    const shtml = useStore(service.platform.shtml.state);
    const app = shtml.app;

    const [expandedItems, setExpandedItems] = useCachedSignal(ExplorerTreeExpandedItemsCacheKey, []);

    const expanded = (id: string) => expandedItems().includes(id);
    const toggle = (id: string) => setExpandedItems(items => $Array.toggle(items, id));
    const select = (type: ExplorerNode, id: string) => explorer.selectedItem({ type, id });
    const isSelected = (type: ExplorerNode, id: string) => explorer.selectedItem.type() === type && explorer.selectedItem.id() === id;

    const Row = defineComponent((props: { icon: Icon; label: JSX.Element; selected?: boolean; select?: () => void; expandable?: boolean; expanded?: boolean; onToggle?: () => void; contextMenu?: ContextMenuItem[] }) => {
        const context = useContext(TreeViewContext);
        return (
            <div
                class={classNames(classes().item, { selected: !!props.selected })}
                style={{ 'padding-left': `${10 + context.indent * 16}px` }}
                onClick={() => props.select?.()}
                use:ContextMenuDirective={{ items: props.contextMenu ?? [] }}
            >
                <span class={classes().chevronSlot}>
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
                </span>
                <Icon name={props.icon} />
                <span class={classes().label}>{props.label}</span>
            </div>
        );
    });

    const Section = defineComponent((props: { id: string; icon: Icon; label: string; contextMenu?: ContextMenuItem[]; children: JSX.Element }) => {
        const context = useContext(TreeViewContext);
        const isExpanded = createMemo(() => expanded(props.id));
        return (
            <>
                <Row icon={props.icon} expandable expanded={isExpanded()} onToggle={() => toggle(props.id)} label={<span>{props.label}</span>} contextMenu={props.contextMenu} />
                <Show when={isExpanded()}>
                    <TreeViewContext.Provider value={{ indent: context.indent + 1 }}>{props.children}</TreeViewContext.Provider>
                </Show>
            </>
        );
    });

    const VariableItem = defineComponent((props: { id: string }) => {
        const variable = shtml.variables[props.id];
        return (
            <Show when={variable.id()}>
                <Row
                    icon='variable' selected={isSelected(ExplorerNode.Variable, props.id)} select={() => select(ExplorerNode.Variable, props.id)}
                    label={<>
                        <span>{variable.name()}</span>
                        <span style={{ color: Theme().secondary.subText }}>{variable.definition()}</span>
                    </>}
                />
            </Show>
        );
    });

    const ServiceItem = defineComponent((props: { id: string }) => {
        const serviceNode = shtml.services[props.id];
        return (
            <Show when={serviceNode.id()}>
                <Row icon='file-code-corner' selected={isSelected(ExplorerNode.Service, props.id)} select={() => select(ExplorerNode.Service, props.id)} label={<span>{serviceNode.name()}</span>} />
            </Show>
        );
    });

    const TypeItem = defineComponent((props: { id: string }) => {
        const definition = shtml.definitions[props.id];
        return (
            <Show when={definition.id()}>
                <Row icon='shapes' selected={isSelected(ExplorerNode.Definition, props.id)} select={() => select(ExplorerNode.Definition, props.id)} label={<span>{definition.name()}</span>} />
            </Show>
        );
    });

    const ApiItem = defineComponent((props: { id: string }) => {
        const api = shtml.apis[props.id];
        return (
            <Show when={api.id()}>
                <Row
                    icon='globe' selected={isSelected(ExplorerNode.Api, props.id)} select={() => select(ExplorerNode.Api, props.id)}
                    label={<>
                        <span>{api.name()}</span>
                        <span style={{ color: Theme().secondary.subText }}>{api.url()}</span>
                    </>}
                />
            </Show>
        );
    });

    const PageItem = defineComponent((props: { id: string }) => {
        const page = shtml.pages[props.id];
        const context = useContext(TreeViewContext);
        const isExpanded = createMemo(() => expanded(props.id));
        return (
            <Show when={page.id()}>
                <Row
                    icon='monitor' selected={isSelected(ExplorerNode.Page, props.id)} select={() => select(ExplorerNode.Page, props.id)}
                    expandable expanded={isExpanded()} onToggle={() => toggle(props.id)}
                    label={<span>{page.name()}</span>}
                />
                <Show when={isExpanded()}>
                    <TreeViewContext.Provider value={{ indent: context.indent + 1 }}>
                        <Section id={`${props.id}:variables`} icon='variable' label='Variables'>
                            <For each={page.variableIds()}>{id => <VariableItem id={id} />}</For>
                        </Section>
                        <Row icon='file' selected={isSelected(ExplorerNode.PageScript, props.id)} select={() => select(ExplorerNode.PageScript, props.id)} label={<span>Script</span>} />
                        <Row icon='file' selected={isSelected(ExplorerNode.PageStyle, props.id)} select={() => select(ExplorerNode.PageStyle, props.id)} label={<span>Style</span>} />
                    </TreeViewContext.Provider>
                </Show>
            </Show>
        );
    });

    const ComponentItem = defineComponent((props: { id: string }) => {
        const component = shtml.components[props.id];
        return (
            <Show when={component.id()}>
                <Row icon='cuboid' selected={isSelected(ExplorerNode.Component, props.id)} select={() => select(ExplorerNode.Component, props.id)} label={<span>{component.name()}</span>} />
            </Show>
        );
    });

    const AssetItem = defineComponent((props: { id: string }) => {
        const asset = shtml.assets[props.id];
        return (
            <Show when={asset.id()}>
                <Row icon='image' selected={isSelected(ExplorerNode.Asset, props.id)} select={() => select(ExplorerNode.Asset, props.id)} label={<span>{asset.name()}</span>} />
            </Show>
        );
    });

    return (
        <Show when={app.id()}>
            <div class={classes().tree}>
                <Row icon='milestone' selected={isSelected(ExplorerNode.Router, app.id())} select={() => select(ExplorerNode.Router, app.id())} label={<span>Router</span>} />
                <Section id='app-variables' icon='variable' label='Variables' contextMenu={VariableContextMenu}>
                    <For each={app.variableIds()}>{id => <VariableItem id={id} />}</For>
                </Section>
                <Section id='app-services' icon='file-code-corner' label='Services'>
                    <For each={app.serviceIds()}>{id => <ServiceItem id={id} />}</For>
                </Section>
                <Section id='app-types' icon='shapes' label='Types'>
                    <For each={app.definitionIds()}>{id => <TypeItem id={id} />}</For>
                </Section>
                <Section id='app-apis' icon='globe' label='APIs'>
                    <For each={app.apiIds()}>{id => <ApiItem id={id} />}</For>
                </Section>
                <Section id='app-pages' icon='monitor' label='Pages'>
                    <For each={app.pageIds()}>{id => <PageItem id={id} />}</For>
                </Section>
                <Section id='app-components' icon='cuboid' label='Components'>
                    <For each={app.componentIds()}>{id => <ComponentItem id={id} />}</For>
                </Section>
                <Section id='app-assets' icon='image' label='Assets'>
                    <For each={app.assetIds()}>{id => <AssetItem id={id} />}</For>
                </Section>
                <Row icon='boxes' selected={isSelected(ExplorerNode.Packages, app.id())} select={() => select(ExplorerNode.Packages, app.id())} label={<span>Packages</span>} />
            </div>
        </Show>
    );
}
