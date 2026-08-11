import { defineComponent, useInjector, useStore } from '@vorplex/solid';
import { FormInputComponent } from '../../../../../../components/forms/form-input.component';
import { PlatformService } from '../../../../../../services/platform.service';

export const IfPropertiesPanelComponent = defineComponent((props: { ifId: string }) => {

    const service = useInjector({
        platform: PlatformService
    });

    const shtml = useStore(service.platform.shtml.state);
    const ifNode = shtml.ifs[props.ifId];

    return (
        <FormInputComponent
            type={'textarea'}
            label={'Condition'}
            value={ifNode.condition()}
            onChange={value => ifNode.condition(value)}
        />
    );
});
