import { SignalProxy } from '@vorplex/core';
import { useInjector, useStore } from '@vorplex/solid';
import { Match, Switch } from 'solid-js';
import { ApiEditorComponent } from './editors/api-editor/api-editor.component';
import { EndpointEditorComponent } from './editors/api-editor/endpoint-editor.component';
import { AssetEditorComponent } from './editors/asset-editor/asset-editor.component';
import { ComponentEventEditorComponent } from './editors/component-event-editor.component';
import { ComponentPropertyEditorComponent } from './editors/component-property-editor.component';
import { PackagesEditorComponent } from './editors/packages-editor/packages-editor.component';
import { RouterEditorComponent } from './editors/router-editor/router-editor.component';
import { ServiceEditorComponent } from './editors/service-editor/service-editor.component';
import { ScriptEditorComponent } from './editors/template-container-editor/script-editor.component';
import { StyleEditorComponent } from './editors/template-container-editor/style-editor.component';
import { TemplateContainerEditorComponent } from './editors/template-container-editor/template-container-editor.component';
import { TypeEditorComponent } from './editors/type-editor/type-editor.component';
import { VariableEditorComponent } from './editors/variable-editor/variable-editor.component';
import { ExplorerTreeComponent } from './explorer-tree.component';
import { ExplorerNode, ExplorerSelectedItem, ExplorerService } from './explorer.service';

export function ExplorerComponent() {

    const service = useInjector({
        explorer: ExplorerService
    });

    const explorerStore = useStore(service.explorer.state);

    const getSelectedItem = <T extends ExplorerNode>() => explorerStore.selectedItem as unknown as SignalProxy<Extract<ExplorerSelectedItem, { type: T }>>;

    return (
        <div style={{
            display: 'grid',
            'grid-template-columns': '300px auto',
            "grid-template-rows": '1fr',
            gap: '5px',
            overflow: 'hidden'
        }}>
            <ExplorerTreeComponent />
            <Switch>
                <Match when={explorerStore.selectedItem.type() === ExplorerNode.Page}>
                    <TemplateContainerEditorComponent target={{ type: 'page', id: explorerStore.selectedItem.id() }} />
                </Match>
                <Match when={explorerStore.selectedItem.type() === ExplorerNode.Component}>
                    <TemplateContainerEditorComponent target={{ type: 'component', id: explorerStore.selectedItem.id() }} />
                </Match>
                <Match when={explorerStore.selectedItem.type() === ExplorerNode.Script}>
                    <ScriptEditorComponent target={getSelectedItem<ExplorerNode.Script>().container()} />
                </Match>
                <Match when={explorerStore.selectedItem.type() === ExplorerNode.Style}>
                    <StyleEditorComponent target={getSelectedItem<ExplorerNode.Style>().container()} />
                </Match>
                <Match when={explorerStore.selectedItem.type() === ExplorerNode.Api}>
                    <ApiEditorComponent apiId={explorerStore.selectedItem.id()} />
                </Match>
                <Match when={explorerStore.selectedItem.type() === ExplorerNode.ApiEndpoint}>
                    <EndpointEditorComponent endpointId={explorerStore.selectedItem.id()} />
                </Match>
                <Match when={explorerStore.selectedItem.type() === ExplorerNode.Type}>
                    <TypeEditorComponent typeId={explorerStore.selectedItem.id()} />
                </Match>
                <Match when={explorerStore.selectedItem.type() === ExplorerNode.Variable}>
                    <VariableEditorComponent
                        variableId={explorerStore.selectedItem.id()}
                        scope={getSelectedItem<ExplorerNode.Variable>().scope()}
                    />
                </Match>
                <Match when={explorerStore.selectedItem.type() === ExplorerNode.ComponentProperty}>
                    <ComponentPropertyEditorComponent
                        propertyId={explorerStore.selectedItem.id()}
                        componentId={getSelectedItem<ExplorerNode.ComponentProperty>().componentId()}
                    />
                </Match>
                <Match when={explorerStore.selectedItem.type() === ExplorerNode.ComponentEvent}>
                    <ComponentEventEditorComponent
                        eventId={explorerStore.selectedItem.id()}
                        componentId={getSelectedItem<ExplorerNode.ComponentEvent>().componentId()}
                    />
                </Match>
                <Match when={explorerStore.selectedItem.type() === ExplorerNode.Router}>
                    <RouterEditorComponent />
                </Match>
                <Match when={explorerStore.selectedItem.type() === ExplorerNode.Service}>
                    <ServiceEditorComponent serviceId={explorerStore.selectedItem.id()} />
                </Match>
                <Match when={explorerStore.selectedItem.type() === ExplorerNode.Packages}>
                    <PackagesEditorComponent scopeId={explorerStore.selectedItem.id()} />
                </Match>
                <Match when={explorerStore.selectedItem.type() === ExplorerNode.Asset}>
                    <AssetEditorComponent assetId={explorerStore.selectedItem.id()} />
                </Match>
            </Switch>
        </div>
    );
}
