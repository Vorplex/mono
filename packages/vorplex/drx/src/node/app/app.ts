import { DependencyTree } from '@vorplex/compiler';
import { DrxDom } from '../../dom';
import type { DrxDocumentState } from '../../document';
import { DrxApi } from '../api/api';
import { DrxAsset } from '../asset';
import { DrxComponent } from '../component/component';
import { DrxDependencyTree } from '../dependency-tree';
import { NodeType } from '../node-type';
import { DrxPackages } from '../packages';
import { DrxPage } from '../page';
import { DrxService } from '../service';
import { DrxTemplate, DrxTemplateItem } from '../template-item';
import { DrxType } from '../type';
import { DrxVariable } from '../variable';
import { DrxPwaMetadata } from './pwa-metadata';

export interface DrxApp {
    id: string;
    name?: string;
    script?: string;
    style?: string;
    packages?: Record<string, string>;
    dependencyTree?: DependencyTree;
    pwaMetadata?: DrxPwaMetadata;
    pageIds: string[];
    variableIds: string[];
    serviceIds: string[];
    assetIds: string[];
    componentIds: string[];
    typeIds: string[];
    apiIds: string[];
    template: DrxTemplateItem[];
}

export const DrxApp = class {

    public static parse(element: Element, state: DrxDocumentState): DrxApp {
        const pages = DrxDom.parseChildren(element, NodeType.Page, child => DrxPage.parse(child, state));
        const variables = DrxDom.parseChildren(element, NodeType.Variable, child => DrxVariable.parse(child, state));
        const services = DrxDom.parseChildren(element, NodeType.Service, child => DrxService.parse(child, state));
        const assets = DrxDom.parseChildren(element, NodeType.Asset, child => DrxAsset.parse(child, state));
        const components = DrxDom.parseChildren(element, NodeType.Component, child => DrxComponent.parse(child, state));
        const types = DrxDom.parseChildren(element, NodeType.Type, child => DrxType.parse(child, state));
        const apis = DrxDom.parseChildren(element, NodeType.Api, child => DrxApi.parse(child, state));
        return {
            id: DrxDom.getId(element),
            name: DrxDom.getAttribute(element, 'name'),
            script: DrxDom.getScript(element),
            style: DrxDom.getStyle(element),
            packages: DrxDom.parseChildren(element, NodeType.Packages, child => DrxPackages.parse(child))[0],
            dependencyTree: DrxDom.parseChildren(element, NodeType.DependencyTree, child => DrxDependencyTree.parse(child))[0],
            pwaMetadata: DrxDom.parseChildren(element, NodeType.PwaMetadata, child => DrxPwaMetadata.parse(child))[0],
            pageIds: pages.map(page => page.id),
            variableIds: variables.map(variable => variable.id),
            serviceIds: services.map(service => service.id),
            assetIds: assets.map(asset => asset.id),
            componentIds: components.map(component => component.id),
            typeIds: types.map(type => type.id),
            apiIds: apis.map(api => api.id),
            template: DrxTemplate.parse(element, state)
        };
    }

    public static to(app: DrxApp, state: DrxDocumentState): Element {
        const element = document.createElement(NodeType.App);
        DrxDom.setAttribute(element, 'id', app.id);
        if (app.name) DrxDom.setAttribute(element, 'name', app.name);
        if (app.packages) element.appendChild(DrxPackages.to(app.packages));
        if (app.dependencyTree) element.appendChild(DrxDependencyTree.to(app.dependencyTree));
        if (app.pwaMetadata) element.appendChild(DrxPwaMetadata.to(app.pwaMetadata));
        DrxDom.createScript(element, app.script);
        DrxDom.createStyle(element, app.style);
        for (const id of app.typeIds) element.appendChild(DrxType.to(state.types[id]));
        for (const id of app.variableIds) element.appendChild(DrxVariable.to(state.variables[id]));
        for (const id of app.serviceIds) element.appendChild(DrxService.to(state.services[id]));
        for (const id of app.assetIds) element.appendChild(DrxAsset.to(state.assets[id]));
        for (const id of app.apiIds) element.appendChild(DrxApi.to(state.apis[id], state));
        for (const id of app.componentIds) element.appendChild(DrxComponent.to(state.components[id], state));
        for (const id of app.pageIds) element.appendChild(DrxPage.to(state.pages[id], state));
        for (const child of DrxTemplate.to(app.template, state)) element.appendChild(child);
        return element;
    }

    public static children(app: DrxApp): DrxTemplateItem[] {
        return [
            ...app.pageIds.map(id => ({ type: NodeType.Page, id })),
            ...app.componentIds.map(id => ({ type: NodeType.Component, id })),
            ...app.variableIds.map(id => ({ type: NodeType.Variable, id })),
            ...app.serviceIds.map(id => ({ type: NodeType.Service, id })),
            ...app.assetIds.map(id => ({ type: NodeType.Asset, id })),
            ...app.typeIds.map(id => ({ type: NodeType.Type, id })),
            ...app.apiIds.map(id => ({ type: NodeType.Api, id })),
            ...app.template
        ];
    }

}
