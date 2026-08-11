import { defineComponent, useInjector, useStore } from '@vorplex/solid';
import { MonacoComponent } from '../../../../components/script-editor/script-editor.component';
import { PlatformService } from '../../../../services/platform.service';

export const PageScriptEditorComponent = defineComponent((props: { pageId: string }) => {

    const service = useInjector({
        platform: PlatformService
    });

    const shtml = useStore(service.platform.shtml.state);
    const page = shtml.pages[props.pageId];

    return (
        <MonacoComponent
            value={page.script()}
            onChanging={value => page.script(value)}
        />
    );
});