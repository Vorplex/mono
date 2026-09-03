import { NodeType } from '@vorplex/shtml';
import { defineRemountingComponent, useInjector, useStore } from '@vorplex/solid';
import { type IDisposable } from 'monaco-editor';
import { onCleanup, onMount } from 'solid-js';
import { MonacoComponent } from '../../../../components/script-editor/monaco.component';
import { IntellisenseService, type IntellisenseTarget } from '../../../../services/intellisense.service';
import { PlatformService } from '../../../../services/platform.service';
import { ContainerTarget } from '../../explorer.service';

export const ScriptEditorComponent = defineRemountingComponent((props: { target: ContainerTarget }) => {

    const service = useInjector({
        platform: PlatformService,
        intellisense: IntellisenseService
    });

    const shtml = useStore(service.platform.shtml.state);
    const container = {
        [NodeType.App]: shtml.app,
        [NodeType.Page]: shtml.pages[props.target.id],
        [NodeType.Component]: shtml.components[props.target.id]
    }[props.target.type];

    const target: IntellisenseTarget = {
        [NodeType.App]: { type: 'app' as const },
        [NodeType.Page]: { type: 'page' as const, pageId: props.target.id },
        [NodeType.Component]: { type: 'component' as const, componentId: props.target.id }
    }[props.target.type];

    let intellisense: IDisposable | undefined;
    onMount(async () => {
        intellisense = await service.intellisense.registerIntellisense(service.platform.shtml, target);
    });
    onCleanup(() => intellisense?.dispose());

    return (
        <MonacoComponent
            value={container.script()}
            onChanging={value => container.script(value)}
        />
    );
});
