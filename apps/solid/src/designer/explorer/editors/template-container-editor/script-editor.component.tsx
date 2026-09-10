import { NodeType } from '@vorplex/drx';
import { defineRemountingComponent, useInjector, useStore } from '@vorplex/solid';
import { type IDisposable } from 'monaco-editor';
import { onCleanup, onMount } from 'solid-js';
import { MonacoComponent } from '../../../../components/script-editor/monaco.component';
import { IntellisenseService, type IntellisenseTarget } from '../../../../services/intellisense.service';
import { ContainerTarget, PlatformService } from '../../../../services/platform.service';

export const ScriptEditorComponent = defineRemountingComponent((props: { target: ContainerTarget }) => {

    const service = useInjector({
        platform: PlatformService,
        intellisense: IntellisenseService
    });

    const drx = useStore(service.platform.drx.state);
    const container = {
        [NodeType.App]: drx.app,
        [NodeType.Page]: drx.pages[props.target.id],
        [NodeType.Component]: drx.components[props.target.id]
    }[props.target.type];

    const target: IntellisenseTarget = {
        [NodeType.App]: { type: 'app' as const },
        [NodeType.Page]: { type: 'page' as const, pageId: props.target.id },
        [NodeType.Component]: { type: 'component' as const, componentId: props.target.id }
    }[props.target.type];

    let intellisense: IDisposable | undefined;
    onMount(async () => {
        intellisense = await service.intellisense.registerIntellisense(service.platform.drx, target);
    });
    onCleanup(() => intellisense?.dispose());

    return (
        <MonacoComponent
            value={container.script()}
            onChanging={value => container.script(value)}
        />
    );
});
