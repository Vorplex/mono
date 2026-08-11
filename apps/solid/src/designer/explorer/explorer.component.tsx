import { useInjector, useStore } from '@vorplex/solid';
import { Match, Switch } from 'solid-js';
import { ApiEditorComponent } from './editors/api-editor/api-editor.component';
import { ComponentEditorComponent } from './editors/component-editor/component-editor.component';
import { PageEditorComponent } from './editors/page-editor/page-editor.component';
import { PageScriptEditorComponent } from './editors/page-editor/page-script-editor.component';
import { PageStyleEditorComponent } from './editors/page-editor/page-style-editor.component';
import { ExplorerTreeComponent } from './explorer-tree.component';
import { ExplorerNode, ExplorerService } from './explorer.service';

export function ExplorerComponent() {

    const service = useInjector({
        explorer: ExplorerService
    });

    const explorerStore = useStore(service.explorer.state);

    return (
        <div style={{
            display: 'grid',
            "grid-template-columns": '350px auto',
            overflow: 'hidden'
        }}>
            <ExplorerTreeComponent />
            <Switch>
                <Match when={explorerStore.selectedItem.type() === ExplorerNode.Page}>
                    <PageEditorComponent pageId={explorerStore.selectedItem.id()} />
                </Match>
                <Match when={explorerStore.selectedItem.type() === ExplorerNode.PageScript}>
                    <PageScriptEditorComponent pageId={explorerStore.selectedItem.id()} />
                </Match>
                <Match when={explorerStore.selectedItem.type() === ExplorerNode.PageStyle}>
                    <PageStyleEditorComponent pageId={explorerStore.selectedItem.id()} />
                </Match>
                <Match when={explorerStore.selectedItem.type() === ExplorerNode.Component}>
                    <ComponentEditorComponent componentId={explorerStore.selectedItem.id()} />
                </Match>
                <Match when={explorerStore.selectedItem.type() === ExplorerNode.Api}>
                    <ApiEditorComponent apiId={explorerStore.selectedItem.id()} />
                </Match>
            </Switch>
        </div>
    );
}