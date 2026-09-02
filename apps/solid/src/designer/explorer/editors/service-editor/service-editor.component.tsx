import { defineRemountingComponent, useInjector, useStore } from '@vorplex/solid';
import { MonacoComponent } from '../../../../components/script-editor/script-editor.component';
import { PlatformService } from '../../../../services/platform.service';

export const ServiceEditorComponent = defineRemountingComponent((props: { serviceId: string }) => {

    const service = useInjector({
        platform: PlatformService
    });

    const shtml = useStore(service.platform.shtml.state);
    const serviceNode = shtml.services[props.serviceId];

    return (
        <MonacoComponent
            value={serviceNode.script()}
            onChanging={value => serviceNode.script(value)}
        />
    );
});
