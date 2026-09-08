import { $Id, Scope, Signal, State } from '@vorplex/core';
import { ExpressionParser } from '../../expression-parser';
import { PreviewContext } from '../../preview-context';
import { ComponentRenderContext, RenderContext, RenderContextType } from '../../render-context';
import { ScriptCompiler } from '../../script-compiler';
import { DrxDocumentState, DrxScope } from '../../drx';
import { DrxDom } from '../../drx-dom';
import { StyleSheet } from '../../style-sheet';
import { DrxApi } from '../api/api';
import { DrxAsset } from '../asset';
import { NodeType } from '../node-type';
import { DrxTemplate, DrxTemplateItem } from '../template-item';
import { DrxVariable } from '../variable';
import { DrxComponent } from './component';

export interface DrxComponentInstance {
    id: string;
    type: NodeType.ComponentInstance;
    component: string;
    attributes: Record<string, string>;
}

// Component isolation: a component only ever sees its own nested <x-component> declarations, or the app's
// top-level ones -- never an enclosing component's, no matter how deeply nested. Pages aren't isolated, so a
// lookup starting from a page context walks up through parent contexts until it hits a component or the app.
function resolveComponent(context: RenderContext, name: string): DrxComponent | undefined {
    if (context.type === RenderContextType.Component) {
        return context.component.componentIds.map(id => context.state.components[id]).find(component => component.name === name);
    }
    if (context.type === RenderContextType.App) {
        return context.app.componentIds.map(id => context.state.components[id]).find(component => component.name === name);
    }
    return context.parent ? resolveComponent(context.parent, name) : undefined;
}

export const DrxComponentInstance = {
    from(parent: Element, state: DrxDocumentState): DrxTemplateItem[] {
        const elements = Array.from(parent.querySelectorAll(`:scope > ${NodeType.ComponentInstance}`));
        return elements.map(element => DrxComponentInstance.parse(element, state));
    },
    parse(element: Element, state: DrxDocumentState): DrxTemplateItem {
        const item: DrxComponentInstance = {
            id: DrxDom.getAttribute(element, 'id') ?? $Id.guid(),
            type: NodeType.ComponentInstance,
            component: DrxDom.getRequiredAttribute(element, 'component'),
            attributes: element.getAttributeNames()
                .filter(name => name !== 'component' && name !== 'id')
                .reduce((attributes, name) => Object.assign(attributes, { [name]: element.getAttribute(name) }), {})
        };
        state.componentInstances[item.id] = item;
        return { id: item.id, type: item.type };
    },
    to(item: DrxComponentInstance): Element {
        const element = document.createElement(NodeType.ComponentInstance);
        DrxDom.setAttribute(element, 'id', item.id);
        DrxDom.setAttribute(element, 'component', item.component);
        for (const [name, value] of Object.entries(item.attributes)) DrxDom.setAttribute(element, name, value);
        return element;
    },
    // Isolated: fully sandboxed from app/page context, reachable only through declared props (in) and events
    // (out). `component` is an expression, so this re-resolves and remounts the whole subtree whenever its
    // dependencies change, exactly like <x-page-container>.
    mount(container: Node, item: DrxComponentInstance, context: RenderContext): Scope {
        return Signal.scope(() => {
            const state = context.state;
            ExpressionParser.bind(item.component, context.locals, componentName => {
                const definition = resolveComponent(context, componentName);
                if (!definition) throw new Error(`Unknown component "${componentName}"`);
                const host = document.createElement(NodeType.ComponentInstance);
                host.style.display = 'contents';
                container.appendChild(host);
                const shadow = host.attachShadow({ mode: 'open' });
                StyleSheet.adopt(shadow, () => definition.style);

                const variables = definition.variableIds.map(id => state.variables[id]);
                const { locals: variableLocals, states: variableStates } = DrxVariable.instantiate(variables);
                const events = definition.eventIds.map(id => state.componentEvents[id]);
                const eventLocals = events.reduce((locals, event) => Object.assign(locals, { [event.name]: (payload?: any) => eventsApi[event.name].emit(payload) }), {} as Record<string, any>);
                const props = new Map<string, State<any>>();
                const propLocals: Record<string, any> = {};
                const eventsApi: Record<string, { emit(payload?: any): void }> = {};
                // Whatever name the consumer writes is checked directly against the declared <x-event> names --
                // no assumed "on" prefix. An attribute matching a declared event wins over treating it as a prop.
                for (const [attribute, value] of Object.entries(item.attributes)) {
                    if (events.some(event => event.name === attribute)) {
                        eventsApi[attribute] = { emit: (payload?: any) => ExpressionParser.invoke(value, { ...context.locals, event: payload }) };
                        continue;
                    }
                    const propState = new State<any>(undefined);
                    props.set(attribute, propState);
                    propLocals[attribute] = propState.signal.proxy;
                    ExpressionParser.bind(value, context.locals, value => propState.set(value));
                }
                for (const event of events) eventsApi[event.name] ??= { emit: () => { } };

                const componentContext: ComponentRenderContext = {
                    type: RenderContextType.Component,
                    parent: context,
                    nearest: {},
                    locals: {},
                    state,
                    compiled: context.compiled,
                    component: definition,
                    variables: variableStates,
                    props,
                    serviceInstances: new Map()
                };
                componentContext.nearest = { component: componentContext };

                const scope: DrxScope = { type: 'component', componentId: definition.id };
                // A component script never gets its own variables/props as bare identifiers -- only via
                // drx.component.variables.<name> / drx.component.props.<name>().
                const componentDrx = {
                    component: {
                        variables: DrxVariable.createApi(variables, variableStates, scope, state),
                        props: Array.from(props).reduce((api, [name, propState]) => Object.assign(api, { [name]: () => propState.value }), {} as Record<string, () => any>),
                        events: eventsApi
                    },
                    apis: DrxApi.createApi(definition.apiIds, state, scope),
                    services: ScriptCompiler.instantiateServices(definition.serviceIds, state, context.compiled, componentContext.serviceInstances)
                };
                const ComponentClass = ScriptCompiler.instantiate(context.compiled, definition.id, componentDrx);
                const instance = ComponentClass ? new ComponentClass() : undefined;
                // No `router`/`modal` here, matching components' isolation from ambient app/page context -- both
                // are page-rendering concerns a component never legitimately needs.
                componentContext.locals = {
                    asset: DrxAsset.toLocal(definition.assetIds, state),
                    ...ScriptCompiler.bindMethods(instance),
                    ...variableLocals,
                    ...propLocals,
                    ...eventLocals
                };

                DrxTemplate.mount(shadow, definition.template, componentContext);
                instance?.onMount?.();
                Signal.cleanup(() => {
                    instance?.onUnmount?.();
                    host.remove();
                });
            });
        });
    },
    // `component` is only ever resolved by literal, structural name lookup -- both here and in the real
    // runtime, this was never evaluation. A dynamic ({{ }}) target can't be resolved without evaluating it,
    // so it's left as an unresolved placeholder instead of guessed at. Isolation is preserved the same way as
    // `mount`: the instance's own template sees only its own declarations, via `PreviewContext.withComponent`
    // replacing (not merging into) the ambient scope -- no props/events are threaded through, since every
    // {{ }} reference inside the instance's template (including ones to its own props) is masked, not
    // resolved, so there's nothing for a prop value to feed into at preview time.
    preview(container: Node, id: string, context: PreviewContext): Node {
        const host = document.createElement(NodeType.ComponentInstance);
        host.style.display = 'contents';
        container.appendChild(host);
        const shadow = host.attachShadow({ mode: 'open' });
        Signal.effect(() => {
            const name = context.root.proxy.componentInstances[id].component();
            if (!ExpressionParser.isLiteral(name)) {
                host.setAttribute('data-drx-preview', 'unresolved');
                return;
            }
            const components = context.root.proxy.components();
            const scope = context.componentId ? context.root.proxy.components[context.componentId].componentIds() : context.root.proxy.app.componentIds();
            const definition = scope.map(componentId => components[componentId]).find(component => component.name === name);
            if (!definition) {
                host.setAttribute('data-drx-preview', 'unknown');
                return;
            }
            host.removeAttribute('data-drx-preview');
            // context.styleSheets last -- adoptedStyleSheets resolves equal-specificity conflicts by array
            // order, last wins, so the designer's own overlays (hover outline, selection highlight) stay
            // visible over whatever the component's own style declares for the same selector.
            StyleSheet.adopt(shadow, () => context.root.proxy.components[definition.id].style(), ...context.styleSheets);
            DrxTemplate.preview(shadow, () => context.root.proxy.components[definition.id].template(), { ...context, componentId: definition.id });
        });
        Signal.cleanup(() => host.remove());
        return host;
    }
};
