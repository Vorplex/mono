import { $Id, Scope, Signal } from '@vorplex/core';
import { PreviewContext } from '../../preview-context';
import { DrxDocumentState } from '../../drx';
import { DrxDom } from '../../drx-dom';
import { StyleSheet } from '../../style-sheet';
import { DrxApi } from '../api/api';
import { DrxAsset } from '../asset';
import { NodeType } from '../node-type';
import { DrxPackages } from '../packages';
import { DrxService } from '../service';
import { DrxTemplate, DrxTemplateItem } from '../template-item';
import { DrxType } from '../type';
import { DrxVariable } from '../variable';
import { DrxComponentEvent } from './event';
import { DrxComponentProperty } from './property';

export interface DrxComponent {
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
    template: DrxTemplateItem[];
}

export const DrxComponent = {
    from(parent: Element, state: DrxDocumentState): DrxComponent[] {
        const elements = Array.from(parent.querySelectorAll(`:scope > ${NodeType.Component}`));
        return elements.map(element => DrxComponent.parse(element, state));
    },
    parse(element: Element, state: DrxDocumentState): DrxComponent {
        const variables = DrxVariable.from(element, state);
        const services = DrxService.from(element, state);
        const assets = DrxAsset.from(element, state);
        const types = DrxType.from(element, state);
        const properties = DrxComponentProperty.from(element, state);
        const events = DrxComponentEvent.from(element, state);
        const apis = DrxApi.from(element, state);
        const children = DrxComponent.from(element, state);
        const component: DrxComponent = {
            id: DrxDom.getAttribute(element, 'id') ?? $Id.guid(),
            name: DrxDom.getRequiredAttribute(element, 'name'),
            script: DrxDom.getScript(element),
            style: DrxDom.getStyle(element),
            packages: DrxPackages.from(element),
            variableIds: variables.map(variable => variable.id),
            serviceIds: services.map(service => service.id),
            assetIds: assets.map(asset => asset.id),
            typeIds: types.map(type => type.id),
            propertyIds: properties.map(property => property.id),
            eventIds: events.map(event => event.id),
            apiIds: apis.map(api => api.id),
            componentIds: children.map(child => child.id),
            template: DrxTemplate.from(element, state)
        };
        state.components[component.id] = component;
        return component;
    },
    to(component: DrxComponent, state: DrxDocumentState): Element {
        const element = document.createElement(NodeType.Component);
        element.setAttribute('id', component.id);
        element.setAttribute('name', component.name);
        DrxDom.createScript(element, component.script);
        DrxDom.createStyle(element, component.style);
        if (component.packages) element.appendChild(DrxPackages.to(component.packages));
        for (const id of component.typeIds) element.appendChild(DrxType.to(state.types[id]));
        for (const id of component.propertyIds) element.appendChild(DrxComponentProperty.to(state.componentProperties[id]));
        for (const id of component.eventIds) element.appendChild(DrxComponentEvent.to(state.componentEvents[id]));
        for (const id of component.variableIds) element.appendChild(DrxVariable.to(state.variables[id]));
        for (const id of component.serviceIds) element.appendChild(DrxService.to(state.services[id]));
        for (const id of component.assetIds) element.appendChild(DrxAsset.to(state.assets[id]));
        for (const id of component.apiIds) element.appendChild(DrxApi.to(state.apis[id], state));
        for (const id of component.componentIds) element.appendChild(DrxComponent.to(state.components[id], state));
        for (const child of DrxTemplate.to(component.template, state)) element.appendChild(child);
        return element;
    },
    preview(container: Node, id: string, context: PreviewContext): Scope {
        return Signal.scope(() => {
            const host = document.createElement(NodeType.Component);
            host.style.display = 'contents';
            container.appendChild(host);
            const shadow = host.attachShadow({ mode: 'open' });
            StyleSheet.adopt(shadow, () => context.root.proxy.components[id].style(), ...context.styleSheets);
            DrxTemplate.preview(shadow, () => context.root.proxy.components[id].template(), { ...context, componentId: id });
            Signal.cleanup(() => host.remove());
        });
    }
};
