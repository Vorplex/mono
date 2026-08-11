import { Injectable, InjectInstance, State } from '@vorplex/core';
import { PageEditorService } from './editors/page-editor/page-editor.service';

export enum ExplorerNode {
    Page,
    PageScript,
    PageStyle,
    Component,
    Api,
    Variable,
    Router,
    Asset,
    Packages,
    Definition,
    Service
}

export interface PageEditorState {
    selectedItem?: { type: ExplorerNode, id: string };
    mode: 'design' | 'preview';
}

@Injectable({ global: true })
export class ExplorerService {

    declare public static inject: { pageEditor: () => typeof PageEditorService };

    public readonly state = new State<PageEditorState>({
        mode: 'design'
    });

    constructor(private services: InjectInstance<typeof ExplorerService.inject>) {

    }

    public selectItem(type: ExplorerNode, id: string) {
        this.state.update({
            selectedItem: {
                type,
                id
            }
        });
        this.services.pageEditor.state.update({ selectedTreeItem: null });
    }

}
ExplorerService.inject = {
    pageEditor: () => PageEditorService
};