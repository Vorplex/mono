import { defineRemountingComponent, useInjector, useStore } from '@vorplex/solid';
import { TsonEditorComponent } from '../../../../components/tson-editor.component';
import { PlatformService } from '../../../../services/platform.service';

export const TypeEditorComponent = defineRemountingComponent((props: { typeId: string }) => {

    const service = useInjector({
        platform: PlatformService
    });

    const drx = useStore(service.platform.drx.state);
    const type = drx.types[props.typeId];

    return (
        <TsonEditorComponent
            name={type.name()}
            definition={type.type()}
            onChange={definition => service.platform.drx.state.reduce(reducer => [
                reducer.types.entity.updateById(props.typeId, { type: definition })
            ])}
        />
    );
});
