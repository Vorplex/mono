import { $Id, Scope, Signal, State } from '@vorplex/core';
import { DocumentStyles } from '../../document-styles';
import { DrxDocumentState, DrxScope } from '../../drx';
import { DrxDom } from '../../drx-dom';
import { DrxExpressionParser } from '../../expression-parser';
import { PreviewContext } from '../../preview-context';
import { ComponentRenderContext, RenderContext, RenderContextType } from '../../render-context';
import { DrxScripting } from '../../scripting';
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
    mount(container: Node, item: DrxComponentInstance, context: RenderContext): Scope {
        return Signal.scope(() => {
            const state = context.state;
            DrxExpressionParser.bind(item.component, context.locals, componentName => {
                const resolveComponent = (context: RenderContext, name: string): DrxComponent | undefined => {
                    if (context.type === RenderContextType.Component) {
                        return context.component.componentIds
                            .map(id => context.state.components[id])
                            .find(component => component.name === name);
                    }
                    if (context.type === RenderContextType.App) {
                        return context.app.componentIds
                            .map(id => context.state.components[id])
                            .find(component => component.name === name);
                    }
                    return context.parent ? resolveComponent(context.parent, name) : undefined;
                };
                const definition = resolveComponent(context, componentName);
                if (!definition) throw new Error(`Unknown component "${componentName}"`);
                const host = document.createElement(NodeType.ComponentInstance);
                host.style.display = 'contents';
                container.appendChild(host);
                const shadow = host.attachShadow({ mode: 'open' });
                DocumentStyles.mirror(shadow);

                const variables = definition.variableIds.map(id => state.variables[id]);
                const { locals: variableLocals, states: variableStates } = DrxVariable.instantiate(variables);
                const events = definition.eventIds.map(id => state.componentEvents[id]);
                const eventLocals = events.reduce((locals, event) => Object.assign(locals, { [event.name]: (payload?: any) => eventsApi[event.name].emit(payload) }), {} as Record<string, any>);
                const properties = new Map<string, State<any>>();
                const propertyLocals: Record<string, any> = {};
                const eventsApi: Record<string, { emit(payload?: any): void }> = {};
                const getAttributeValue = (name: string) => Object.entries(item.attributes).find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1];
                for (const event of events) {
                    const handler = getAttributeValue(event.name);
                    eventsApi[event.name] = { emit: handler == null ? () => { } : (payload?: any) => DrxExpressionParser.invoke(handler, { ...context.locals, event: payload }) };
                }
                for (const property of definition.propertyIds.map(id => state.componentProperties[id])) {
                    const propertyState = new State<any>();
                    properties.set(property.name, propertyState);
                    propertyLocals[property.name] = propertyState.signal.proxy;
                    const value = getAttributeValue(property.name);
                    if (value != null) DrxExpressionParser.bind(value, context.locals, resolved => propertyState.set(resolved));
                }
                const componentContext: ComponentRenderContext = {
                    type: RenderContextType.Component,
                    parent: context,
                    nearest: {},
                    locals: {},
                    state,
                    bundle: context.bundle,
                    component: definition,
                    variables: variableStates,
                    properties,
                    serviceInstances: new Map()
                };
                componentContext.nearest = { component: componentContext };

                const scope: DrxScope = { type: 'component', componentId: definition.id };
                const componentDrx = {
                    component: {
                        variables: DrxVariable.createApi(variables, variableStates, scope, state),
                        props: Array.from(properties).reduce((api, [name, propState]) => Object.assign(api, { [name]: () => propState.value }), {} as Record<string, () => any>),
                        events: eventsApi,
                        root: shadow
                    },
                    apis: DrxApi.createApi(state, scope),
                    services: DrxScripting.instantiateServices(definition.serviceIds, state, context.bundle, componentContext.serviceInstances, scope)
                };
                const ComponentClass = DrxScripting.instantiate(context.bundle, definition.id, componentDrx);
                const instance = ComponentClass ? new ComponentClass() : undefined;
                componentContext.locals = {
                    asset: DrxAsset.toLocal(definition.assetIds, state),
                    ...DrxScripting.getFunctionLocals(instance),
                    ...variableLocals,
                    ...propertyLocals,
                    ...eventLocals
                };

                StyleSheet.adopt(shadow, () => DrxExpressionParser.parse(definition.style ?? '', componentContext.locals));
                StyleSheet.registerDocumentRules(shadow.ownerDocument, definition.id, () => DrxExpressionParser.parse(definition.style ?? '', componentContext.locals));
                DrxTemplate.mount(shadow, definition.template, componentContext);
                instance?.onMount?.();
                Signal.cleanup(() => {
                    instance?.onUnmount?.();
                    host.remove();
                });
            });
        });
    },
    preview(container: Node, id: string, context: PreviewContext): Node {
        const host = document.createElement(NodeType.ComponentInstance);
        host.style.display = 'contents';
        host.setAttribute('data-drx-id', id);
        container.appendChild(host);
        const shadow = host.attachShadow({ mode: 'open' });
        DocumentStyles.mirror(shadow);
        Signal.effect(() => {
            const name = context.root.proxy.componentInstances[id].component();
            if (!DrxExpressionParser.isLiteral(name)) {
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
            StyleSheet.adopt(shadow, () => context.root.proxy.components[definition.id].style(), ...context.styleSheets);
            StyleSheet.registerDocumentRules(shadow.ownerDocument, definition.id, () => context.root.proxy.components[definition.id].style());
            DrxTemplate.preview(shadow, () => context.root.proxy.components[definition.id].template(), { ...context, componentId: definition.id });
        });
        Signal.cleanup(() => host.remove());
        return host;
    }
};
