import { NodeType } from '@vorplex/shtml';
import { defineRemountingComponent, useInjector, useStore } from '@vorplex/solid';
import { MonacoComponent } from '../../../../components/script-editor/script-editor.component';
import { PlatformService } from '../../../../services/platform.service';
import { ContainerTarget } from '../../explorer.service';

export const StyleEditorComponent = defineRemountingComponent((props: { target: ContainerTarget }) => {

    const service = useInjector({
        platform: PlatformService
    });

    const shtml = useStore(service.platform.shtml.state);
    const container = {
        [NodeType.App]: shtml.app,
        [NodeType.Page]: shtml.pages[props.target.id],
        [NodeType.Component]: shtml.components[props.target.id]
    }[props.target.type];

    return (
        <MonacoComponent
            language={'css'}
            value={container.style()}
            onChanging={value => container.style(value)}
        />
    );
});
