import { NodeType } from '@vorplex/shtml';
import { useStore } from '@vorplex/solid';
import { Match, Switch, useContext } from 'solid-js';
import { TemplateContainerEditorContext } from '../template-container-editor-context';
import { ElementPropertiesPanelComponent } from './properties-panels/element-properties-panel.component';
import { ForPropertiesPanelComponent } from './properties-panels/for-properties-panel.component';
import { IfPropertiesPanelComponent } from './properties-panels/if-properties-panel.component';
import { PageContainerPropertiesPanelComponent } from './properties-panels/page-container.component';

export function PropertiesPanelComponent() {

    const editor = useStore(useContext(TemplateContainerEditorContext));

    return (
        <Switch>
            <Match when={editor.selectedTreeItem.type() === NodeType.If}>
                <IfPropertiesPanelComponent ifId={editor.selectedTreeItem.id()} />
            </Match>
            <Match when={editor.selectedTreeItem.type() === NodeType.For}>
                <ForPropertiesPanelComponent forId={editor.selectedTreeItem.id()} />
            </Match>
            <Match when={editor.selectedTreeItem.type() === NodeType.PageContainer}>
                <PageContainerPropertiesPanelComponent pageContainerId={editor.selectedTreeItem.id()} />
            </Match>
            <Match when={editor.selectedTreeItem.type() === NodeType.Element}>
                <ElementPropertiesPanelComponent elementId={editor.selectedTreeItem.id()} />
            </Match>
        </Switch>
    );
}
