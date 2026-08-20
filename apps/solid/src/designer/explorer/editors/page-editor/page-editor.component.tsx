import { defineComponent } from '@vorplex/solid';
import { PageEditorTreeComponent } from './page-editor-tree.component';
import { PagePreviewComponent } from './page-preview.component';
import { PropertiesPanelComponent } from './properties-panel/properties-panel.component';

export const PageEditorComponent = defineComponent((props: { pageId: string }) => {

    return (
        <div style={{
            display: 'grid',
            'grid-template-columns': '300px auto 300px',
            'grid-template-rows': '100%',
            gap: '5px',
            height: '100%',
            overflow: 'hidden'
        }}>
            <PageEditorTreeComponent pageId={props.pageId} />
            <PagePreviewComponent pageId={props.pageId} />
            <PropertiesPanelComponent pageId={props.pageId} />
        </div>
    );
});
