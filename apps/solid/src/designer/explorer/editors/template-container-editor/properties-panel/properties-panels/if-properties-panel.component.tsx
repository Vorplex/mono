import { createStyle, defineRemountingComponent, useInjector, useStore } from '@vorplex/solid';
import { $Tson } from '../../../../../../../../../packages/vorplex/core/src';
import { FieldComponent } from '../../../../../../components/forms/form-input.component';
import { PanelComponent } from '../../../../../../components/panel.component';
import { PlatformService } from '../../../../../../services/platform.service';
import { ExpressionInputComponent } from '../expression-input.component';

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

    const drx = useStore(service.platform.drx.state);
    const ifNode = drx.ifs[props.ifId];

    return (
        <PanelComponent icon='sliders-horizontal' title='If Properties'>
            <div class={classes().properties}>
                <FieldComponent label={'Condition'}>
                    <ExpressionInputComponent
                        value={ifNode.condition()}
                        accepts={$Tson.boolean()}
                        locals={service.platform.drx.getLocals(props.ifId)}
                        onChange={value => ifNode.condition(value)}
                    />
                </FieldComponent>
            </div>
        </PanelComponent>
    );
});
