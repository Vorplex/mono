import { Injectable, State } from '@vorplex/core';
import { NodeType } from '@vorplex/shtml';

export enum ExplorerNode {
    Page,
    Component,
    ComponentEvent,
    ComponentProperty,
    Script,
    Style,
    Api,
    ApiEndpoint,
    Variable,
    Router,
    Asset,
    Packages,
    Type,
    Service
}

export type VariableScope =
    | { type: 'app' }
    | { type: 'page'; pageId: string }
    | { type: 'component'; componentId: string };

export type ContainerTarget =
    | { type: NodeType.App; id: string }
    | { type: NodeType.Page; id: string }
    | { type: NodeType.Component; id: string };

export type ExplorerSelectedItem =
    | { type: ExplorerNode.Page; id: string }
    | { type: ExplorerNode.Component; id: string }
    | { type: ExplorerNode.Script; id: string; container: ContainerTarget }
    | { type: ExplorerNode.Style; id: string; container: ContainerTarget }
    | { type: ExplorerNode.Api; id: string }
    | { type: ExplorerNode.ApiEndpoint; id: string }
    | { type: ExplorerNode.Variable; id: string; scope: VariableScope }
    | { type: ExplorerNode.ComponentProperty; id: string; componentId: string }
    | { type: ExplorerNode.ComponentEvent; id: string; componentId: string }
    | { type: ExplorerNode.Router; id: string }
    | { type: ExplorerNode.Asset; id: string }
    | { type: ExplorerNode.Packages; id: string }
    | { type: ExplorerNode.Type; id: string }
    | { type: ExplorerNode.Service; id: string };

export interface ExplorerState {
    selectedItem?: ExplorerSelectedItem;
    mode: 'design' | 'preview' | 'shtml';
}

@Injectable({ global: true })
export class ExplorerService {

    public readonly state = new State<ExplorerState>({
        mode: 'design'
    });

    public selectItem(item: ExplorerSelectedItem) {
        this.state.update({
            selectedItem: item
        });
    }

}
