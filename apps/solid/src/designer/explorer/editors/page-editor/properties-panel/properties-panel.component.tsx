import { NodeType } from '@vorplex/shtml';
import { defineComponent, useInjector, useStore } from '@vorplex/solid';
import { Match, Switch } from 'solid-js';
import { PageEditorService } from '../page-editor.service';
import { ElementPropertiesPanelComponent } from './properties-panels/element-properties-panel.component';
import { ForPropertiesPanelComponent } from './properties-panels/for-properties-panel.component';
import { IfPropertiesPanelComponent } from './properties-panels/if-properties-panel.component';
import { PageContainerPropertiesPanelComponent } from './properties-panels/page-container.component';
import { PagePropertiesPanelComponent } from './properties-panels/page-properties-panel.component';

export const PropertiesPanelComponent = defineComponent((props: { pageId: string }) => {

    const service = useInjector({
        pageEditor: PageEditorService
    });

    const pageEditor = useStore(service.pageEditor.state);

    return (
        <Switch>
            <Match when={!pageEditor.selectedTreeItem()}>
                <PagePropertiesPanelComponent pageId={props.pageId} />
            </Match>
            <Match when={pageEditor.selectedTreeItem.type() === NodeType.If}>
                <IfPropertiesPanelComponent ifId={pageEditor.selectedTreeItem.id()} />
            </Match>
            <Match when={pageEditor.selectedTreeItem.type() === NodeType.For}>
                <ForPropertiesPanelComponent forId={pageEditor.selectedTreeItem.id()} />
            </Match>
            <Match when={pageEditor.selectedTreeItem.type() === NodeType.PageContainer}>
                <PageContainerPropertiesPanelComponent pageContainerId={pageEditor.selectedTreeItem.id()} />
            </Match>
            <Match when={pageEditor.selectedTreeItem.type() === NodeType.Element}>
                <ElementPropertiesPanelComponent elementId={pageEditor.selectedTreeItem.id()} />
            </Match>
        </Switch>
    );
});
