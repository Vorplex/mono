import { createStyle, defineRemountingComponent, useInjector, useStore } from '@vorplex/solid';
import { $Tson } from '../../../../../../../../../packages/vorplex/core/src';
import { FieldComponent } from '../../../../../../components/forms/form-input.component';
import { PanelComponent } from '../../../../../../components/panel.component';
import { PlatformService } from '../../../../../../services/platform.service';
import { BindingInputComponent } from '../binding-value-editor.component';

const classes = createStyle(() => ({
    properties: {
        display: 'grid',
        gridAutoRows: 'max-content',
        overflowY: 'auto'
    },
}));

export const IfPropertiesPanelComponent = defineRemountingComponent((props: { ifId: string }) => {

    const service = useInjector({
        platform: PlatformService
    });

    const shtml = useStore(service.platform.shtml.state);
    const ifNode = shtml.ifs[props.ifId];

    return (
        <PanelComponent icon='sliders-horizontal' title='If Properties'>
            <div class={classes().properties}>
                <FieldComponent label={'Condition'}>
                    <BindingInputComponent
                        value={ifNode.condition()}
                        accepts={$Tson.boolean()}
                        locals={service.platform.shtml.getLocals(props.ifId)}
                        onChange={value => ifNode.condition(value)}
                    />
                </FieldComponent>
            </div>
        </PanelComponent>
    );
});
