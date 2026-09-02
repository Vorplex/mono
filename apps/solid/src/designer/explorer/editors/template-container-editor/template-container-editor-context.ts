import { State } from '@vorplex/core';
import { NodeType } from '@vorplex/shtml';
import { createContext } from 'solid-js';

export type TemplateContainerTarget =
    | { type: 'page'; id: string }
    | { type: 'component'; id: string };

export interface TemplateContainerEditorState {
    selectedTreeItem?: { type: NodeType, id: string, path: string[] };
    hoveredTreeItem?: { type: NodeType, id: string };
}

export const TemplateContainerEditorContext = createContext<State<TemplateContainerEditorState>>();
