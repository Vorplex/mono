import { defineRemountingComponent, useInjector, useStore } from '@vorplex/solid';
import { parse, stringify } from 'yaml';
import { MonacoComponent } from '../../../../components/script-editor/monaco.component';
import { PlatformService } from '../../../../services/platform.service';

export const PackagesEditorComponent = defineRemountingComponent((props: { scopeId: string }) => {

    const service = useInjector({
        platform: PlatformService
    });

    const drx = useStore(service.platform.drx.state);
    const scope = drx.app.id() === props.scopeId ? drx.app : drx.components[props.scopeId];

    return (
        <MonacoComponent
            language={'yaml'}
            value={stringify(scope.packages() ?? {})}
            onChanging={value => scope.packages(parse(value))}
        />
    );
});
