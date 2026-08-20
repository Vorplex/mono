import { $String, $Tson } from '@vorplex/core';
import { createStyle, defineComponent, useInjector, useStore } from '@vorplex/solid';
import { FormInputComponent, FormInputLabelComponent } from '../../../../../../components/forms/form-input.component';
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

export const ForPropertiesPanelComponent = defineComponent((props: { forId: string }) => {

    const service = useInjector({
        platform: PlatformService
    });

    const shtml = useStore(service.platform.shtml.state);
    const forNode = shtml.fors[props.forId];

    return (
        <PanelComponent icon='sliders-horizontal' title='For Properties'>
            <div class={classes().properties}>
                <FormInputLabelComponent label='Each' />
                <BindingInputComponent
                    value={forNode.each()}
                    locals={service.platform.shtml.getLocals(forNode.id())}
                    accepts={$Tson.union({ union: [$Tson.array(), $Tson.object(), $Tson.record()] })}
                    onChange={value => forNode.each(value)}
                />
                <FormInputComponent
                    type={'text'}
                    label={'As'}
                    value={forNode.as()}
                    onChange={value => forNode.as(value)}
                    error={$String.isNullOrEmpty(forNode.as()) ? 'Required' : null}
                />
                <FormInputComponent
                    type={'text'}
                    label={'Index'}
                    subText={'(optional)'}
                    value={forNode.index()}
                    onChange={value => forNode.index(value)}
                />
                <FormInputComponent
                    type={'text'}
                    label={'Key'}
                    subText={'(optional)'}
                    value={forNode.key()}
                    onChange={value => forNode.key(value)}
                />
                <FormInputComponent
                    type={'text'}
                    label={'Track'}
                    subText={'(optional)'}
                    value={forNode.track()}
                    onChange={value => forNode.track(value)}
                />
            </div>
        </PanelComponent>
    );
});
