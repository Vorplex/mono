import { createStyle, defineComponent, useInjector, useStore } from '@vorplex/solid';
import { FormInputComponent } from '../../../../../../components/forms/form-input.component';
import { PlatformService } from '../../../../../../services/platform.service';
import { PanelComponent } from '../../../../../../components/panel.component';

const classes = createStyle(() => ({
    properties: {
        display: 'grid',
        gridAutoRows: 'max-content',
        overflowY: 'auto'
    },
}));

export const IfPropertiesPanelComponent = defineComponent((props: { ifId: string }) => {

    const service = useInjector({
        platform: PlatformService
    });

    const shtml = useStore(service.platform.shtml.state);
    const ifNode = shtml.ifs[props.ifId];

    return (
        <PanelComponent icon='sliders-horizontal' title='If Properties'>
            <div class={classes().properties}>
                <FormInputComponent
                    type={'textarea'}
                    label={'Condition'}
                    value={ifNode.condition()}
                    onChange={value => ifNode.condition(value)}
                />
            </div>
        </PanelComponent>
    );
});
