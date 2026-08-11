import { defineComponent } from '@vorplex/solid';
import { EndpointEditorTreeComponent } from './endpoint-tree.component';

export const ApiEditorComponent = defineComponent((props: { apiId: string }) => {

    return (
        <div>
            <EndpointEditorTreeComponent apiId={props.apiId} />
        </div>
    );
});
