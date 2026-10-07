import { DependencyTree } from '@vorplex/compiler';
import { DrxDom } from '../../dom';
import type { DrxDocumentState } from '../../document';
import { DrxApi } from '../api/api';
import { DrxAsset } from '../asset';
import { DrxDependencyTree } from '../dependency-tree';
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
    dependencyTree?: DependencyTree;
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

export const DrxComponent = class {

    public static parse(element: Element, state: DrxDocumentState): DrxComponent {
        const variables = DrxDom.parseChildren(element, NodeType.Variable, child => DrxVariable.parse(child, state));
        const services = DrxDom.parseChildren(element, NodeType.Service, child => DrxService.parse(child, state));
        const assets = DrxDom.parseChildren(element, NodeType.Asset, child => DrxAsset.parse(child, state));
        const types = DrxDom.parseChildren(element, NodeType.Type, child => DrxType.parse(child, state));
        const properties = DrxDom.parseChildren(element, NodeType.ComponentProperty, child => DrxComponentProperty.parse(child, state));
        const events = DrxDom.parseChildren(element, NodeType.ComponentEvent, child => DrxComponentEvent.parse(child, state));
        const apis = DrxDom.parseChildren(element, NodeType.Api, child => DrxApi.parse(child, state));
        const children = DrxDom.parseChildren(element, NodeType.Component, child => DrxComponent.parse(child, state));
        const component: DrxComponent = {
            id: DrxDom.getId(element),
            name: DrxDom.getRequiredAttribute(element, 'name'),
            script: DrxDom.getScript(element),
            style: DrxDom.getStyle(element),
            packages: DrxDom.parseChildren(element, NodeType.Packages, child => DrxPackages.parse(child))[0],
            dependencyTree: DrxDom.parseChildren(element, NodeType.DependencyTree, child => DrxDependencyTree.parse(child))[0],
            variableIds: variables.map(variable => variable.id),
            serviceIds: services.map(service => service.id),
            assetIds: assets.map(asset => asset.id),
            typeIds: types.map(type => type.id),
            propertyIds: properties.map(property => property.id),
            eventIds: events.map(event => event.id),
            apiIds: apis.map(api => api.id),
            componentIds: children.map(child => child.id),
            template: DrxTemplate.parse(element, state)
        };
        state.components[component.id] = component;
        return component;
    }

    public static to(component: DrxComponent, state: DrxDocumentState): Element {
        const element = document.createElement(NodeType.Component);
        DrxDom.setAttribute(element, 'id', component.id);
        DrxDom.setAttribute(element, 'name', component.name);
        if (component.packages) element.appendChild(DrxPackages.to(component.packages));
        if (component.dependencyTree) element.appendChild(DrxDependencyTree.to(component.dependencyTree));
        DrxDom.createScript(element, component.script);
        DrxDom.createStyle(element, component.style);
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
    }

    public static children(component: DrxComponent): DrxTemplateItem[] {
        return [
            ...component.componentIds.map(id => ({ type: NodeType.Component, id })),
            ...component.variableIds.map(id => ({ type: NodeType.Variable, id })),
            ...component.serviceIds.map(id => ({ type: NodeType.Service, id })),
            ...component.assetIds.map(id => ({ type: NodeType.Asset, id })),
            ...component.typeIds.map(id => ({ type: NodeType.Type, id })),
            ...component.apiIds.map(id => ({ type: NodeType.Api, id })),
            ...component.propertyIds.map(id => ({ type: NodeType.ComponentProperty, id })),
            ...component.eventIds.map(id => ({ type: NodeType.ComponentEvent, id })),
            ...component.template
        ];
    }

}
