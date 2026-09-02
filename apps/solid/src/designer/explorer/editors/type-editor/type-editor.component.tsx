import { defineRemountingComponent, useInjector, useStore } from '@vorplex/solid';
import { TsonEditorComponent } from '../../../../components/tson-editor.component';
import { PlatformService } from '../../../../services/platform.service';

export const TypeEditorComponent = defineRemountingComponent((props: { typeId: string }) => {

    const service = useInjector({
        platform: PlatformService
    });

    const shtml = useStore(service.platform.shtml.state);
    const type = shtml.types[props.typeId];

    return (
        <TsonEditorComponent
            name={type.name()}
            definition={type.type()}
            onChange={definition => service.platform.shtml.state.reduce(reducer => [
                reducer.types.entity.updateById(props.typeId, { type: definition })
            ])}
        />
    );
});
