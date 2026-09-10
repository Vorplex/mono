import { NodeType } from '@vorplex/drx';
import { defineRemountingComponent, useInjector, useStore } from '@vorplex/solid';
import { MonacoComponent } from '../../../../components/script-editor/monaco.component';
import { ContainerTarget, PlatformService } from '../../../../services/platform.service';

export const StyleEditorComponent = defineRemountingComponent((props: { target: ContainerTarget }) => {

    const service = useInjector({
        platform: PlatformService
    });

    const drx = useStore(service.platform.drx.state);
    const container = {
        [NodeType.App]: drx.app,
        [NodeType.Page]: drx.pages[props.target.id],
        [NodeType.Component]: drx.components[props.target.id]
    }[props.target.type];

    return (
        <MonacoComponent
            language={'css'}
            value={container.style()}
            onChanging={value => container.style(value)}
        />
    );
});
