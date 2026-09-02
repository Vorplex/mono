import { $Array } from '@vorplex/core';
import { NodeType } from '@vorplex/shtml';
import { createStyle, useCachedSignal, useInjector, useStore } from '@vorplex/solid';
import { classNames } from '@vorplex/web';
import { createMemo, For, Show, useContext, type JSX } from 'solid-js';
import { Icon } from '../../components/icon.component';
import { PanelComponent } from '../../components/panel.component';
import { TreeViewContext } from '../../components/tree-view-item.component';
import { Theme } from '../../consts/theme';
import { ContextMenuItem } from '../../directives/context-menu.directive';
import { PlatformService } from '../../services/platform.service';
import { ApiContextMenu, createApiItemContextMenu } from './context-menus/api.context-menu';
import { AssetContextMenu, createAssetItemContextMenu } from './context-menus/asset.context-menu';
import { ComponentScope, createComponentContextMenu, createComponentItemContextMenu } from './context-menus/component.context-menu';
import { createEndpointItemContextMenu } from './context-menus/endpoint.context-menu';
import { createEventContextMenu, createEventItemContextMenu } from './context-menus/event.context-menu';
import { createPageItemContextMenu, PageContextMenu } from './context-menus/page.context-menu';
import { createPropertyContextMenu, createPropertyItemContextMenu } from './context-menus/property.context-menu';
import { createServiceContextMenu, createServiceItemContextMenu, ServiceScope } from './context-menus/service.context-menu';
import { createTypeContextMenu, createTypeItemContextMenu, TypeScope } from './context-menus/type.context-menu';
import { createVariableContextMenu, createVariableItemContextMenu } from './context-menus/variable.context-menu';
import { ContainerTarget, ExplorerNode, ExplorerSelectedItem, ExplorerService, VariableScope } from './explorer.service';

const classes = createStyle(() => ({
    tree: {
        display: 'grid',
        gridAutoRows: 'max-content',
        overflow: 'hidden',
        overflowY: 'auto'
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
    const select = (item: ExplorerSelectedItem) => explorer.selectedItem(item);
    const isSelected = (item: ExplorerSelectedItem) => explorer.selectedItem.type() === item.type && explorer.selectedItem.id() === item.id;

    const Row = (props: { icon: Icon; label: JSX.Element; selected?: boolean; select?: () => void; expandable?: boolean; expanded?: boolean; onToggle?: () => void; contextMenu?: ContextMenuItem[] }) => {
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
    };

    const Section = (props: { id: string; icon: Icon; label: string; contextMenu?: ContextMenuItem[]; children: JSX.Element }) => {
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
    };

    const VariableItem = (props: { id: string; scope: VariableScope }) => {
        const variable = shtml.variables[props.id];
        return (
            <Show when={variable.id()}>
                <Row
                    icon='variable' selected={isSelected({ type: ExplorerNode.Variable, id: props.id, scope: props.scope })} select={() => select({ type: ExplorerNode.Variable, id: props.id, scope: props.scope })}
                    contextMenu={createVariableItemContextMenu(props.scope, props.id, variable.name())}
                    label={<>
                        <span>{variable.name()}</span>
                        <span style={{ color: Theme().secondary.subText }}>{variable.type()}</span>
                    </>}
                />
            </Show>
        );
    };

    const ServiceItem = (props: { id: string; scope: ServiceScope }) => {
        const serviceNode = shtml.services[props.id];
        return (
            <Show when={serviceNode.id()}>
                <Row
                    icon='file-code-corner' selected={isSelected({ type: ExplorerNode.Service, id: props.id })} select={() => select({ type: ExplorerNode.Service, id: props.id })}
                    contextMenu={createServiceItemContextMenu(props.scope, props.id, serviceNode.name())}
                    label={<span>{serviceNode.name()}</span>}
                />
            </Show>
        );
    };

    const TypeItem = (props: { id: string; scope: TypeScope }) => {
        const type = shtml.types[props.id];
        return (
            <Show when={type.id()}>
                <Row
                    icon='shapes'
                    selected={isSelected({ type: ExplorerNode.Type, id: props.id })}
                    select={() => select({ type: ExplorerNode.Type, id: props.id })}
                    contextMenu={createTypeItemContextMenu(props.scope, props.id, type.name())}
                    label={<span>{type.name()}</span>}
                />
            </Show>
        );
    };

    const PropertyItem = (props: { componentId: string; id: string }) => {
        const property = shtml.componentProperties[props.id];
        return (
            <Show when={property.id()}>
                <Row
                    icon='list'
                    selected={isSelected({ type: ExplorerNode.ComponentProperty, id: props.id, componentId: props.componentId })}
                    select={() => select({ type: ExplorerNode.ComponentProperty, id: props.id, componentId: props.componentId })}
                    contextMenu={createPropertyItemContextMenu(props.componentId, props.id, property.name())}
                    label={<>
                        <span>{property.name()}</span>
                        <span style={{ color: Theme().secondary.subText }}>{property.type()}</span>
                    </>}
                />
            </Show>
        );
    };

    const EventItem = (props: { componentId: string; id: string }) => {
        const event = shtml.componentEvents[props.id];
        return (
            <Show when={event.id()}>
                <Row
                    icon='zap'
                    selected={isSelected({ type: ExplorerNode.ComponentEvent, id: props.id, componentId: props.componentId })}
                    select={() => select({ type: ExplorerNode.ComponentEvent, id: props.id, componentId: props.componentId })}
                    contextMenu={createEventItemContextMenu(props.componentId, props.id, event.name())}
                    label={<>
                        <span>{event.name()}</span>
                        <span style={{ color: Theme().secondary.subText }}>{event.type()}</span>
                    </>}
                />
            </Show>
        );
    };

    const EndpointItem = (props: { apiId: string; id: string }) => {
        const endpoint = shtml.apiEndpoints[props.id];
        return (
            <Show when={endpoint.id()}>
                <Row
                    icon='plug' selected={isSelected({ type: ExplorerNode.ApiEndpoint, id: props.id })} select={() => select({ type: ExplorerNode.ApiEndpoint, id: props.id })}
                    contextMenu={createEndpointItemContextMenu(props.apiId, props.id, endpoint.name())}
                    label={<>
                        <span style={{ color: Theme().accent.color }}>{endpoint.method()}</span>
                        <span>{endpoint.name()}</span>
                        <span style={{ color: Theme().secondary.subText }}>{endpoint.path()}</span>
                    </>}
                />
            </Show>
        );
    };

    const ApiItem = (props: { id: string }) => {
        const api = shtml.apis[props.id];
        const context = useContext(TreeViewContext);
        const isExpanded = createMemo(() => expanded(props.id));
        return (
            <Show when={api.id()}>
                <Row
                    icon='globe' selected={isSelected({ type: ExplorerNode.Api, id: props.id })} select={() => select({ type: ExplorerNode.Api, id: props.id })}
                    expandable expanded={isExpanded()} onToggle={() => toggle(props.id)}
                    contextMenu={createApiItemContextMenu(props.id, api.name())}
                    label={<>
                        <span>{api.name()}</span>
                        <span style={{ color: Theme().secondary.subText }}>{api.url()}</span>
                    </>}
                />
                <Show when={isExpanded()}>
                    <TreeViewContext.Provider value={{ indent: context.indent + 1 }}>
                        <For each={api.endpointIds()}>{id => <EndpointItem apiId={props.id} id={id} />}</For>
                    </TreeViewContext.Provider>
                </Show>
            </Show>
        );
    };

    const PageItem = (props: { id: string }) => {
        const page = shtml.pages[props.id];
        const context = useContext(TreeViewContext);
        const isExpanded = createMemo(() => expanded(props.id));
        const container: ContainerTarget = { type: NodeType.Page, id: props.id };
        return (
            <Show when={page.id()}>
                <Row
                    icon='monitor' selected={isSelected({ type: ExplorerNode.Page, id: props.id })} select={() => select({ type: ExplorerNode.Page, id: props.id })}
                    expandable expanded={isExpanded()} onToggle={() => toggle(props.id)}
                    contextMenu={createPageItemContextMenu(props.id, page.name())}
                    label={<span>{page.name()}</span>}
                />
                <Show when={isExpanded()}>
                    <TreeViewContext.Provider value={{ indent: context.indent + 1 }}>
                        <Section id={`${props.id}:variables`} icon='variable' label='Variables' contextMenu={createVariableContextMenu({ type: 'page', pageId: props.id })}>
                            <For each={page.variableIds()}>{id => <VariableItem id={id} scope={{ type: 'page', pageId: props.id }} />}</For>
                        </Section>
                        <Row icon='file' selected={isSelected({ type: ExplorerNode.Script, id: props.id, container })} select={() => select({ type: ExplorerNode.Script, id: props.id, container })} label={<span>Script</span>} />
                        <Row icon='file-axis-3d' selected={isSelected({ type: ExplorerNode.Style, id: props.id, container })} select={() => select({ type: ExplorerNode.Style, id: props.id, container })} label={<span>Style</span>} />
                    </TreeViewContext.Provider>
                </Show>
            </Show>
        );
    };

    const ComponentItem = (props: { id: string; scope: ComponentScope }) => {
        const component = shtml.components[props.id];
        const context = useContext(TreeViewContext);
        const isExpanded = createMemo(() => expanded(props.id));
        const ownScope: ComponentScope = { type: 'component', componentId: props.id };
        const container: ContainerTarget = { type: NodeType.Component, id: props.id };
        return (
            <Show when={component.id()}>
                <Row
                    icon='cuboid' selected={isSelected({ type: ExplorerNode.Component, id: props.id })} select={() => select({ type: ExplorerNode.Component, id: props.id })}
                    expandable expanded={isExpanded()} onToggle={() => toggle(props.id)}
                    contextMenu={createComponentItemContextMenu(props.scope, props.id, component.name())}
                    label={<span>{component.name()}</span>}
                />
                <Show when={isExpanded()}>
                    <TreeViewContext.Provider value={{ indent: context.indent + 1 }}>
                        <Section id={`${props.id}:variables`} icon='variable' label='Variables' contextMenu={createVariableContextMenu(ownScope)}>
                            <For each={component.variableIds()}>{id => <VariableItem id={id} scope={ownScope} />}</For>
                        </Section>
                        <Section id={`${props.id}:services`} icon='file-code-corner' label='Services' contextMenu={createServiceContextMenu(ownScope)}>
                            <For each={component.serviceIds()}>{id => <ServiceItem id={id} scope={ownScope} />}</For>
                        </Section>
                        <Section id={`${props.id}:types`} icon='shapes' label='Types' contextMenu={createTypeContextMenu(ownScope)}>
                            <For each={component.typeIds()}>{id => <TypeItem id={id} scope={ownScope} />}</For>
                        </Section>
                        <Section id={`${props.id}:properties`} icon='list' label='Properties' contextMenu={createPropertyContextMenu(props.id)}>
                            <For each={component.propertyIds()}>{id => <PropertyItem componentId={props.id} id={id} />}</For>
                        </Section>
                        <Section id={`${props.id}:events`} icon='zap' label='Events' contextMenu={createEventContextMenu(props.id)}>
                            <For each={component.eventIds()}>{id => <EventItem componentId={props.id} id={id} />}</For>
                        </Section>
                        <Section id={`${props.id}:components`} icon='cuboid' label='Components' contextMenu={createComponentContextMenu(ownScope)}>
                            <For each={component.componentIds()}>{id => <ComponentItem id={id} scope={ownScope} />}</For>
                        </Section>
                        <Row
                            icon='boxes'
                            selected={isSelected({ type: ExplorerNode.Packages, id: props.id })}
                            select={() => select({ type: ExplorerNode.Packages, id: props.id })}
                            label={<span>Packages</span>}
                        />
                        <Row icon='file' selected={isSelected({ type: ExplorerNode.Script, id: props.id, container })} select={() => select({ type: ExplorerNode.Script, id: props.id, container })} label={<span>Script</span>} />
                        <Row icon='file-axis-3d' selected={isSelected({ type: ExplorerNode.Style, id: props.id, container })} select={() => select({ type: ExplorerNode.Style, id: props.id, container })} label={<span>Style</span>} />
                    </TreeViewContext.Provider>
                </Show>
            </Show>
        );
    };

    const AssetItem = (props: { id: string }) => {
        const asset = shtml.assets[props.id];
        return (
            <Show when={asset.id()}>
                <Row
                    icon='image' selected={isSelected({ type: ExplorerNode.Asset, id: props.id })} select={() => select({ type: ExplorerNode.Asset, id: props.id })}
                    contextMenu={createAssetItemContextMenu(props.id, asset.name())}
                    label={<span>{asset.name()}</span>}
                />
            </Show>
        );
    };

    return (
        <Show when={app.id()}>
            <PanelComponent icon='layout-panel-left' title='Explorer'>
                <div class={classes().tree}>
                    <Row
                        icon='milestone'
                        selected={isSelected({ type: ExplorerNode.Router, id: app.id() })}
                        select={() => select({ type: ExplorerNode.Router, id: app.id() })}
                        label={<span>Router</span>}
                    />
                    <Section
                        id='app-variables'
                        icon='variable'
                        label='Variables'
                        contextMenu={createVariableContextMenu({ type: 'app' })}
                    >
                        <For each={app.variableIds()}>
                            {(id) => <VariableItem id={id} scope={{ type: 'app' }} />}
                        </For>
                    </Section>
                    <Section id='app-services' icon='file-code-corner' label='Services' contextMenu={createServiceContextMenu({ type: 'app' })}>
                        <For each={app.serviceIds()}>{(id) => <ServiceItem id={id} scope={{ type: 'app' }} />}</For>
                    </Section>
                    <Section id='app-types' icon='shapes' label='Types' contextMenu={createTypeContextMenu({ type: 'app' })}>
                        <For each={app.typeIds()}>{(id) => <TypeItem id={id} scope={{ type: 'app' }} />}</For>
                    </Section>
                    <Section id='app-apis' icon='globe' label='APIs' contextMenu={ApiContextMenu}>
                        <For each={app.apiIds()}>{(id) => <ApiItem id={id} />}</For>
                    </Section>
                    <Section id='app-pages' icon='monitor' label='Pages' contextMenu={PageContextMenu}>
                        <For each={app.pageIds()}>{(id) => <PageItem id={id} />}</For>
                    </Section>
                    <Section id='app-components' icon='cuboid' label='Components' contextMenu={createComponentContextMenu({ type: 'app' })}>
                        <For each={app.componentIds()}>
                            {(id) => <ComponentItem id={id} scope={{ type: 'app' }} />}
                        </For>
                    </Section>
                    <Section id='app-assets' icon='image' label='Assets' contextMenu={AssetContextMenu}>
                        <For each={app.assetIds()}>{(id) => <AssetItem id={id} />}</For>
                    </Section>
                    <Row
                        icon='boxes'
                        selected={isSelected({ type: ExplorerNode.Packages, id: app.id() })}
                        select={() => select({ type: ExplorerNode.Packages, id: app.id() })}
                        label={<span>Packages</span>}
                    />
                    <Row
                        icon='file'
                        selected={isSelected({ type: ExplorerNode.Script, id: app.id(), container: { type: NodeType.App, id: app.id() } })}
                        select={() => select({ type: ExplorerNode.Script, id: app.id(), container: { type: NodeType.App, id: app.id() } })}
                        label={<span>Script</span>}
                    />
                    <Row
                        icon='file-axis-3d'
                        selected={isSelected({ type: ExplorerNode.Style, id: app.id(), container: { type: NodeType.App, id: app.id() } })}
                        select={() => select({ type: ExplorerNode.Style, id: app.id(), container: { type: NodeType.App, id: app.id() } })}
                        label={<span>Style</span>}
                    />
                </div>
            </PanelComponent>
        </Show>
    );
}
