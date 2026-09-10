import { State } from '@vorplex/core';
import { DrxDocument, NodeType } from '@vorplex/drx';

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
    | { type: ExplorerNode.ApiEndpoint; id: string; apiId: string }
    | { type: ExplorerNode.Variable; id: string; scope: VariableScope }
    | { type: ExplorerNode.ComponentProperty; id: string; componentId: string }
    | { type: ExplorerNode.ComponentEvent; id: string; componentId: string }
    | { type: ExplorerNode.Router; id: string }
    | { type: ExplorerNode.Asset; id: string }
    | { type: ExplorerNode.Packages; id: string }
    | { type: ExplorerNode.Type; id: string }
    | { type: ExplorerNode.Service; id: string };

export type TemplateContainerTarget =
    | { type: 'page'; id: string }
    | { type: 'component'; id: string };

export interface TemplateContainerEditorState {
    collapsedItems: string[];
    selectedTreeItem?: { type: NodeType; id: string };
    hoveredTreeItem?: { type: NodeType; id: string };
}

export interface PlatformState {
    explorer: {
        selectedItem?: ExplorerSelectedItem;
        mode: 'design' | 'preview' | 'drx';
        templateEditors: Record<string, TemplateContainerEditorState>;
    };
}

export class PlatformService {

    public drx: DrxDocument;

    public readonly state = new State<PlatformState>({
        explorer: {
            mode: 'design',
            templateEditors: {}
        }
    });

    public async fetch() {
        this.shtml = await ShtmlDocument.fetch('/assets/example/index.shtml');
        // this.shtml = await ShtmlDocument.fetch('/assets/example/gpt-case-management.shtml');
    }

}
