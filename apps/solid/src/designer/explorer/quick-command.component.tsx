import { $String, SignalProxy } from '@vorplex/core';
import { DrxDocumentState } from '@vorplex/drx';
import { createPopup, createStyle, useInjector, useStore } from '@vorplex/solid';
import { $Element } from '@vorplex/web';
import { createEffect, createMemo, createSignal, For, onCleanup, onMount, Show } from 'solid-js';
import { DropdownFormInputComponent } from '../../components/forms/inputs/dropdown.component';
import { HighlightedTextComponent } from '../../components/highlighted-text.component';
import { Icon } from '../../components/icon.component';
import { Classes, Theme } from '../../consts/theme';
import { ExplorerNode, ExplorerSelectedItem, PlatformService } from '../../services/platform.service';

const CATEGORIES = {
    [ExplorerNode.Page]: { label: 'Page', icon: 'monitor' },
    [ExplorerNode.Component]: { label: 'Component', icon: 'cuboid' },
    [ExplorerNode.Variable]: { label: 'Variable', icon: 'variable' },
    [ExplorerNode.Type]: { label: 'Type', icon: 'shapes' },
    [ExplorerNode.Api]: { label: 'Api', icon: 'globe' },
    [ExplorerNode.ApiEndpoint]: { label: 'Endpoint', icon: 'plug' },
    [ExplorerNode.Service]: { label: 'Service', icon: 'file-code-corner' },
    [ExplorerNode.Asset]: { label: 'Asset', icon: 'image' },
    [ExplorerNode.ComponentProperty]: { label: 'Property', icon: 'list' },
    [ExplorerNode.ComponentEvent]: { label: 'Event', icon: 'zap' }
} as const;

const CATEGORY_OPTIONS = [
    { value: 'all' as const, label: 'All' },
    ...Object.entries(CATEGORIES).map(([key, meta]) => ({ value: key, label: meta.label }))
];

interface QuickCommandItem {
    type: ExplorerNode;
    id: string;
    name: string;
    select: ExplorerSelectedItem;
}

interface QuickCommandResult {
    item: QuickCommandItem;
    indexes: number[];
}

const classes = createStyle(() => ({
    container: {
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '40vw',
        maxWidth: '600px',
        minWidth: '320px',
        maxHeight: '60vh',
        display: 'grid',
        gridTemplateRows: 'max-content 1fr',
        gap: '5px',
        padding: '5px',
        background: Theme().primary.color,
        color: Theme().primary.text,
        border: `1px solid ${Theme().outline.primary}`,
        borderRadius: '5px',
        boxShadow: `0px 8px 24px ${Theme().shadow}`,
        overflow: 'hidden'
    },
    searchRow: {
        display: 'flex',
        gap: '5px'
    },
    input: {
        flex: '1 1 auto',
        minWidth: 0
    },
    category: {
        flex: '0 0 150px'
    },
    results: {
        display: 'grid',
        gridAutoRows: 'max-content',
        overflow: 'auto'
    },
    item: {
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        padding: '5px 10px',
        borderRadius: '5px',
        overflow: 'hidden',
        '&:hover': {
            cursor: 'pointer',
            boxShadow: Theme().hoverShadow
        }
    },
    itemSelected: {
        boxShadow: Theme().hoverShadow
    },
    itemName: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flex: '1 1 auto',
        minWidth: 0
    },
    itemLabel: {
        flex: '1 1 auto',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
    },
    itemType: {
        flex: '0 0 150px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        fontSize: '12px',
        color: Theme().primary.subText
    },
    empty: {
        padding: '10px',
        color: Theme().primary.subText,
        textAlign: 'center'
    }
}));

function collectItems(drx: SignalProxy<DrxDocumentState>): QuickCommandItem[] {
    const items: QuickCommandItem[] = [];
    const app = drx.app;

    const addApi = (apiId: string) => {
        const api = drx.apis[apiId];
        items.push({ type: ExplorerNode.Api, id: apiId, name: api.name(), select: { type: ExplorerNode.Api, id: apiId } });
        for (const id of api.endpointIds()) {
            items.push({ type: ExplorerNode.ApiEndpoint, id, name: drx.apiEndpoints[id].name(), select: { type: ExplorerNode.ApiEndpoint, id, apiId } });
        }
        for (const id of api.typeIds()) {
            items.push({ type: ExplorerNode.Type, id, name: drx.types[id].name(), select: { type: ExplorerNode.Type, id } });
        }
    };

    for (const id of app.pageIds()) {
        const page = drx.pages[id];
        items.push({ type: ExplorerNode.Page, id, name: page.name(), select: { type: ExplorerNode.Page, id } });
        for (const variableId of page.variableIds()) {
            items.push({ type: ExplorerNode.Variable, id: variableId, name: drx.variables[variableId].name(), select: { type: ExplorerNode.Variable, id: variableId, scope: { type: 'page', pageId: id } } });
        }
    }
    for (const id of app.variableIds()) {
        items.push({ type: ExplorerNode.Variable, id, name: drx.variables[id].name(), select: { type: ExplorerNode.Variable, id, scope: { type: 'app' } } });
    }
    for (const id of app.typeIds()) {
        items.push({ type: ExplorerNode.Type, id, name: drx.types[id].name(), select: { type: ExplorerNode.Type, id } });
    }
    for (const id of app.serviceIds()) {
        items.push({ type: ExplorerNode.Service, id, name: drx.services[id].name(), select: { type: ExplorerNode.Service, id } });
    }
    for (const id of app.assetIds()) {
        items.push({ type: ExplorerNode.Asset, id, name: drx.assets[id].name(), select: { type: ExplorerNode.Asset, id } });
    }
    for (const id of app.apiIds()) addApi(id);

    const visitComponent = (componentId: string) => {
        const component = drx.components[componentId];
        items.push({ type: ExplorerNode.Component, id: componentId, name: component.name(), select: { type: ExplorerNode.Component, id: componentId } });
        for (const id of component.variableIds()) {
            items.push({ type: ExplorerNode.Variable, id, name: drx.variables[id].name(), select: { type: ExplorerNode.Variable, id, scope: { type: 'component', componentId } } });
        }
        for (const id of component.typeIds()) {
            items.push({ type: ExplorerNode.Type, id, name: drx.types[id].name(), select: { type: ExplorerNode.Type, id } });
        }
        for (const id of component.serviceIds()) {
            items.push({ type: ExplorerNode.Service, id, name: drx.services[id].name(), select: { type: ExplorerNode.Service, id } });
        }
        for (const id of component.propertyIds()) {
            items.push({ type: ExplorerNode.ComponentProperty, id, name: drx.componentProperties[id].name(), select: { type: ExplorerNode.ComponentProperty, id, componentId } });
        }
        for (const id of component.eventIds()) {
            items.push({ type: ExplorerNode.ComponentEvent, id, name: drx.componentEvents[id].name(), select: { type: ExplorerNode.ComponentEvent, id, componentId } });
        }
        for (const apiId of component.apiIds()) addApi(apiId);
        for (const id of component.componentIds()) visitComponent(id);
    };
    for (const id of app.componentIds()) visitComponent(id);

    return items.sort((a, b) => a.name.localeCompare(b.name));
}

export function QuickCommandComponent(props: { close: () => void }) {
    const service = useInjector({
        platform: PlatformService
    });

    const drx = useStore(service.platform.drx.state);

    const [search, setSearch] = createSignal('');
    const [category, setCategory] = createSignal<'all' | ExplorerNode>('all');

    const items = createMemo(() => collectItems(drx));

    const filtered = createMemo((): QuickCommandResult[] => {
        const activeCategory = category();
        const categoryItems = items().filter(item => activeCategory === 'all' || item.type === activeCategory);
        return $String.fuzzySearch(categoryItems, [item => item.name], search()).map(result => ({
            item: result.item,
            indexes: result.matches[0]
        }));
    });

    const [selectedIndex, setSelectedIndex] = createSignal(0);
    let itemRefs: (HTMLDivElement | undefined)[] = [];

    createEffect(() => {
        filtered();
        setSelectedIndex(0);
    });

    createEffect(() => {
        itemRefs[selectedIndex()]?.scrollIntoView({ block: 'nearest' });
    });

    const select = (item: QuickCommandItem) => {
        service.platform.state.set(state => state.explorer.selectedItem, item.select);
        props.close();
    };

    return (
        <div class={classes().container}>
            <div class={classes().searchRow}>
                <div class={classes().category}>
                    <DropdownFormInputComponent
                        options={CATEGORY_OPTIONS}
                        value={category().toString()}
                        onChange={value => setCategory(value === 'all' ? 'all' : Number(value))}
                    />
                </div>
                <input
                    ref={ref => requestAnimationFrame(() => ref?.focus())}
                    class={`${Classes().input} ${classes().input}`}
                    type={'text'}
                    placeholder={'Search the explorer...'}
                    value={search()}
                    onInput={event => setSearch(event.currentTarget.value)}
                    onKeyDown={event => {
                        if (event.key === 'Enter') {
                            const result = filtered()[selectedIndex()];
                            if (result) select(result.item);
                        } else if (event.key === 'ArrowDown') {
                            event.preventDefault();
                            setSelectedIndex(index => Math.min(index + 1, filtered().length - 1));
                        } else if (event.key === 'ArrowUp') {
                            event.preventDefault();
                            setSelectedIndex(index => Math.max(index - 1, 0));
                        }
                    }}
                />
            </div>
            <div class={classes().results}>
                <Show when={filtered().length} fallback={<div class={classes().empty}>No matches</div>}>
                    <For each={filtered()}>
                        {(result, index) => (
                            <div
                                ref={ref => { itemRefs[index()] = ref; }}
                                class={`${classes().item} ${index() === selectedIndex() ? classes().itemSelected : ''}`}
                                onMouseEnter={() => setSelectedIndex(index())}
                                onClick={() => select(result.item)}
                            >
                                <span class={classes().itemType}>{CATEGORIES[result.item.type].label}</span>
                                <div class={classes().itemName}>
                                    <Icon name={CATEGORIES[result.item.type].icon} />
                                    <span class={classes().itemLabel}>
                                        <HighlightedTextComponent text={result.item.name} indexes={result.indexes} />
                                    </span>
                                </div>
                            </div>
                        )}
                    </For>
                </Show>
            </div>
        </div>
    );
}

export function useQuickCommand() {
    let portal: { destroy: () => void } | null;

    onMount(() => {
        const dispose = $Element.addEventListener(document, 'keydown', event => {
            if (!event.ctrlKey || event.code !== 'KeyP') return;
            event.preventDefault();
            if (portal) return;
            portal = createPopup({
                location: { x: 0, y: 0 },
                ghost: false,
                interactive: true,
                render: () => <QuickCommandComponent close={() => portal.destroy()} />,
                onDestroy: () => { portal = null; }
            });
        });
        onCleanup(() => dispose());
    });
}
