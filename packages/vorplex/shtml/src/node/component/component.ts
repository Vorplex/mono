import { $Id, Scope, Signal } from '@vorplex/core';
import { PreviewContext } from '../../preview-context';
import { ShtmlDocumentState } from '../../shtml';
import { ShtmlDom } from '../../shtml-dom';
import { StyleSheet } from '../../style-sheet';
import { ShtmlApi } from '../api/api';
import { ShtmlAsset } from '../asset';
import { NodeType } from '../node-type';
import { ShtmlPackages } from '../packages';
import { ShtmlService } from '../service';
import { ShtmlTemplate, ShtmlTemplateItem } from '../template-item';
import { ShtmlType } from '../type';
import { ShtmlVariable } from '../variable';
import { ShtmlComponentEvent } from './event';
import { ShtmlComponentProperty } from './property';

export interface ShtmlComponent {
    id: string;
    name: string;
    script?: string;
    style?: string;
    packages?: Record<string, string>;
    variableIds: string[];
    serviceIds: string[];
    assetIds: string[];
    typeIds: string[];
    componentIds: string[];
    propertyIds: string[];
    eventIds: string[];
    apiIds: string[];
    template: ShtmlTemplateItem[];
}

export const ShtmlComponent = {
    from(parent: Element, state: ShtmlDocumentState): ShtmlComponent[] {
        const elements = Array.from(parent.querySelectorAll(`:scope > ${NodeType.Component}`));
        return elements.map(element => ShtmlComponent.parse(element, state));
    },
    parse(element: Element, state: ShtmlDocumentState): ShtmlComponent {
        const variables = ShtmlVariable.from(element, state);
        const services = ShtmlService.from(element, state);
        const assets = ShtmlAsset.from(element, state);
        const types = ShtmlType.from(element, state);
        const properties = ShtmlComponentProperty.from(element, state);
        const events = ShtmlComponentEvent.from(element, state);
        const apis = ShtmlApi.from(element, state);
        const children = ShtmlComponent.from(element, state);
        const component: ShtmlComponent = {
            id: ShtmlDom.getAttribute(element, 'id') ?? $Id.guid(),
            name: ShtmlDom.getRequiredAttribute(element, 'name'),
            script: ShtmlDom.getScript(element),
            style: ShtmlDom.getStyle(element),
            packages: ShtmlPackages.from(element),
            variableIds: variables.map(variable => variable.id),
            serviceIds: services.map(service => service.id),
            assetIds: assets.map(asset => asset.id),
            typeIds: types.map(type => type.id),
            propertyIds: properties.map(property => property.id),
            eventIds: events.map(event => event.id),
            apiIds: apis.map(api => api.id),
            componentIds: children.map(child => child.id),
            template: ShtmlTemplate.from(element, state)
        };
        state.components[component.id] = component;
        return component;
    },
    to(component: ShtmlComponent, state: ShtmlDocumentState): Element {
        const element = document.createElement(NodeType.Component);
        element.setAttribute('id', component.id);
        element.setAttribute('name', component.name);
        ShtmlDom.createScript(element, component.script);
        ShtmlDom.createStyle(element, component.style);
        if (component.packages) element.appendChild(ShtmlPackages.to(component.packages));
        for (const id of component.typeIds) element.appendChild(ShtmlType.to(state.types[id]));
        for (const id of component.propertyIds) element.appendChild(ShtmlComponentProperty.to(state.componentProperties[id]));
        for (const id of component.eventIds) element.appendChild(ShtmlComponentEvent.to(state.componentEvents[id]));
        for (const id of component.variableIds) element.appendChild(ShtmlVariable.to(state.variables[id]));
        for (const id of component.serviceIds) element.appendChild(ShtmlService.to(state.services[id]));
        for (const id of component.assetIds) element.appendChild(ShtmlAsset.to(state.assets[id]));
        for (const id of component.apiIds) element.appendChild(ShtmlApi.to(state.apis[id], state));
        for (const id of component.componentIds) element.appendChild(ShtmlComponent.to(state.components[id], state));
        for (const child of ShtmlTemplate.to(component.template, state)) element.appendChild(child);
        return element;
    },
    preview(container: Node, id: string, context: PreviewContext): Scope {
        return Signal.scope(() => {
            const host = document.createElement(NodeType.Component);
            host.style.display = 'contents';
            container.appendChild(host);
            const shadow = host.attachShadow({ mode: 'open' });
            StyleSheet.adopt(shadow, () => context.root.proxy.components[id].style(), ...context.styleSheets);
            ShtmlTemplate.preview(shadow, () => context.root.proxy.components[id].template(), { ...context, componentId: id });
            Signal.cleanup(() => host.remove());
        });
    }
};
