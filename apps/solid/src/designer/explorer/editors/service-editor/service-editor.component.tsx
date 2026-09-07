import { defineRemountingComponent, useInjector, useStore } from '@vorplex/solid';
import { type IDisposable } from 'monaco-editor';
import { onCleanup, onMount } from 'solid-js';
import { MonacoComponent } from '../../../../components/script-editor/monaco.component';
import { IntellisenseService } from '../../../../services/intellisense.service';
import { PlatformService } from '../../../../services/platform.service';

export const ServiceEditorComponent = defineRemountingComponent((props: { serviceId: string }) => {

    const service = useInjector({
        platform: PlatformService,
        intellisense: IntellisenseService
    });

    const drx = useStore(service.platform.drx.state);
    const serviceNode = drx.services[props.serviceId];

    let intellisense: IDisposable | undefined;
    onMount(async () => {
        intellisense = await service.intellisense.registerIntellisense(service.platform.drx, { type: 'service', serviceId: props.serviceId });
    });
    onCleanup(() => intellisense?.dispose());

    return (
        <MonacoComponent
            value={serviceNode.script()}
            onChanging={value => serviceNode.script(value)}
        />
    );
});
