import { defineRemountingComponent } from '@vorplex/solid';
import { TemplateContainerTarget } from '../../../../services/platform.service';
import { PropertiesPanelComponent } from './properties-panel/properties-panel.component';
import { TemplateContainerEditorTreeComponent } from './template-container-editor-tree.component';
import { TemplateContainerPreviewComponent } from './template-container-preview.component';

export const TemplateContainerEditorComponent = defineRemountingComponent((props: { target: TemplateContainerTarget }) => {

    return (
        <div style={{
            display: 'grid',
            'grid-template-columns': '300px auto 300px',
            'grid-template-rows': '100%',
            gap: '5px',
            overflow: 'hidden'
        }}>
            <TemplateContainerEditorTreeComponent target={props.target} />
            <TemplateContainerPreviewComponent target={props.target} />
            <PropertiesPanelComponent target={props.target} />
        </div>
    );
});
