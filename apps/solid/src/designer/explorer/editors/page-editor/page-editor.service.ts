import { Injectable, State } from '@vorplex/core';
import { NodeType } from '@vorplex/shtml';

export interface PageEditorState {
    selectedTreeItem?: { type: NodeType, id: string, path: string[] };
    hoveredTreeItem?: { type: NodeType, id: string };
}

@Injectable({ global: true })
export class PageEditorService {

    public readonly state = new State<PageEditorState>({
    });

}