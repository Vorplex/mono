import { DrxProblem, NodeType } from '@vorplex/drx';
import { createStyle, useInjector, useStore } from '@vorplex/solid';
import { classNames } from '@vorplex/web';
import { createMemo, createSignal, For, on, Show } from 'solid-js';
import { Icon } from '../components/icon.component';
import { Theme } from '../consts/theme';
import { ExplorerNode, PlatformService, VariableScope } from '../services/platform.service';

const classes = createStyle(() => ({
    container: {
        display: 'grid',
        gridTemplateRows: 'max-content max-content',
        borderRadius: '5px',
        border: `1px solid ${Theme().outline.primary}`,
        overflow: 'hidden'
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '7px 10px',
        background: Theme().primary.color,
        color: Theme().primary.text,
        '&:hover': {
            cursor: 'pointer',
            boxShadow: Theme().hoverShadow
        }
    },
    title: {
        flex: '1 1 auto',
        fontWeight: 'bold'
    },
    count: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
    },
    errorCount: {
        color: Theme().error.outline
    },
    warningCount: {
        color: Theme().warning.outline
    },
    body: {
        display: 'grid',
        gridAutoRows: 'max-content',
        maxHeight: '200px',
        overflow: 'auto'
    },
    row: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '5px 10px',
        borderTop: `1px solid ${Theme().outline.primary}`
    },
    code: {
        color: Theme().primary.subText,
        fontFamily: 'monospace'
    },
    message: {
        flex: '1 1 auto',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
    },
    empty: {
        padding: '10px',
        color: Theme().primary.subText,
        textAlign: 'center'
    }
}));

export function ProblemsPanelComponent() {
    const service = useInjector({
        platform: PlatformService
    });

    const drx = useStore(service.platform.drx.state);
    const [expanded, setExpanded] = createSignal(false);

    const problems = createMemo(on(() => drx(), () => service.platform.drx.validate()));
    const errorCount = createMemo(() => problems().filter(problem => problem.severity === 'error').length);
    const warningCount = createMemo(() => problems().filter(problem => problem.severity === 'warning').length);

    const navigate = (problem: DrxProblem) => {
        const target = problem.target;
        const state = drx();
        switch (target.type) {
            case NodeType.Page:
                service.platform.state.set(state => state.explorer.selectedItem, { type: ExplorerNode.Page, id: target.id });
                break;
            case NodeType.Component:
                service.platform.state.set(state => state.explorer.selectedItem, { type: ExplorerNode.Component, id: target.id });
                break;
            case NodeType.Variable: {
                let scope: VariableScope | undefined;
                if (state.app.variableIds.includes(target.id)) {
                    scope = { type: 'app' };
                } else {
                    const page = Object.values(state.pages).find(page => page.variableIds.includes(target.id));
                    if (page) {
                        scope = { type: 'page', pageId: page.id };
                    } else {
                        const component = Object.values(state.components).find(component => component.variableIds.includes(target.id));
                        if (component) scope = { type: 'component', componentId: component.id };
                    }
                }
                if (!scope) return;
                service.platform.state.set(state => state.explorer.selectedItem, { type: ExplorerNode.Variable, id: target.id, scope });
                break;
            }
            case NodeType.Type:
                service.platform.state.set(state => state.explorer.selectedItem, { type: ExplorerNode.Type, id: target.id });
                break;
            case NodeType.Service:
                service.platform.state.set(state => state.explorer.selectedItem, { type: ExplorerNode.Service, id: target.id });
                break;
            case NodeType.Asset:
                service.platform.state.set(state => state.explorer.selectedItem, { type: ExplorerNode.Asset, id: target.id });
                break;
            case NodeType.Api:
                service.platform.state.set(state => state.explorer.selectedItem, { type: ExplorerNode.Api, id: target.id });
                break;
            case NodeType.ApiEndpoint: {
                const api = Object.values(state.apis).find(api => api.endpointIds.includes(target.id));
                if (!api) return;
                service.platform.state.set(state => state.explorer.selectedItem, { type: ExplorerNode.ApiEndpoint, id: target.id, apiId: api.id });
                break;
            }
            case NodeType.ComponentProperty: {
                const component = Object.values(state.components).find(component => component.propertyIds.includes(target.id));
                if (!component) return;
                service.platform.state.set(state => state.explorer.selectedItem, { type: ExplorerNode.ComponentProperty, id: target.id, componentId: component.id });
                break;
            }
            case NodeType.ComponentEvent: {
                const component = Object.values(state.components).find(component => component.eventIds.includes(target.id));
                if (!component) return;
                service.platform.state.set(state => state.explorer.selectedItem, { type: ExplorerNode.ComponentEvent, id: target.id, componentId: component.id });
                break;
            }
            case NodeType.Router:
                service.platform.state.set(state => state.explorer.selectedItem, { type: ExplorerNode.Router, id: target.id });
                break;
            default: {
                const path = service.platform.drx.getTemplatePath(target.id);
                const ancestor = service.platform.drx.getNodeParent(path[0] ?? target.id);
                if (!ancestor || (ancestor.type !== NodeType.Page && ancestor.type !== NodeType.Component)) return;
                service.platform.state.set(state => state.explorer.selectedItem, ancestor.type === NodeType.Page
                    ? { type: ExplorerNode.Page, id: ancestor.id }
                    : { type: ExplorerNode.Component, id: ancestor.id });
                service.platform.state.update(state => state.explorer.templateEditors[ancestor.id], { selectedTreeItem: { type: target.type, id: target.id } });
            }
        }
    };

    return (
        <div class={classes().container}>
            <div class={classes().header} onClick={() => setExpanded(!expanded())}>
                <Icon name={expanded() ? 'chevron-down' : 'chevron-right'} />
                <span class={classes().title}>Problems</span>
                <Show when={errorCount()}>
                    <span class={classNames(classes().count, classes().errorCount)}>
                        <Icon name={'circle-x'} />
                        <span innerText={errorCount()} />
                    </span>
                </Show>
                <Show when={warningCount()}>
                    <span class={classNames(classes().count, classes().warningCount)}>
                        <Icon name={'triangle-alert'} />
                        <span innerText={warningCount()} />
                    </span>
                </Show>
            </div>
            <Show when={expanded()}>
                <div class={classes().body}>
                    <Show when={problems().length} fallback={<div class={classes().empty}>No problems detected</div>}>
                        <For each={problems()}>
                            {problem => (
                                <div
                                    class={classes().row}
                                    onClick={() => navigate(problem)}
                                >
                                    <Icon
                                        name={problem.severity === 'error' ? 'circle-x' : 'triangle-alert'}
                                        style={{ color: problem.severity === 'error' ? Theme().error.outline : Theme().warning.outline }}
                                    />
                                    <span class={classes().code} innerText={`[${problem.code}]`} />
                                    <span class={classes().message} innerText={problem.message} />
                                </div>
                            )}
                        </For>
                    </Show>
                </div>
            </Show>
        </div>
    );
}
