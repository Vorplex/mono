import { State } from '@vorplex/core';
import { defineRemountingComponent } from '@vorplex/solid';
import { PropertiesPanelComponent } from './properties-panel/properties-panel.component';
import { TemplateContainerEditorContext, TemplateContainerEditorState, TemplateContainerTarget } from './template-container-editor-context';
import { TemplateContainerEditorTreeComponent } from './template-container-editor-tree.component';
import { TemplateContainerPreviewComponent } from './template-container-preview.component';

export const TemplateContainerEditorComponent = defineRemountingComponent((props: { target: TemplateContainerTarget }) => {

    const state = new State<TemplateContainerEditorState>({});

    return (
        <TemplateContainerEditorContext.Provider value={state}>
            <div style={{
                display: 'grid',
                'grid-template-columns': '300px auto 300px',
                'grid-template-rows': '100%',
                gap: '5px',
                overflow: 'hidden'
            }}>
                <TemplateContainerEditorTreeComponent target={props.target} />
                <TemplateContainerPreviewComponent target={props.target} />
                <PropertiesPanelComponent />
            </div>
        </TemplateContainerEditorContext.Provider>
    );
});
