import { $Tson } from '@vorplex/core';
import { defineComponent, useInjector, useStore } from '@vorplex/solid';
import { FormInputComponent } from '../../../../../../components/forms/form-input.component';
import { PlatformService } from '../../../../../../services/platform.service';
import { BindingButton } from '../binding-value-editor.component';

export const ForPropertiesPanelComponent = defineComponent((props: { forId: string }) => {

    const service = useInjector({
        platform: PlatformService
    });

    const shtml = useStore(service.platform.shtml.state);
    const forNode = shtml.fors[props.forId];

    return (
        <div>
            <FormInputComponent
                type={'textarea'}
                label={'Each'}
                value={forNode.each()}
                onChange={value => forNode.each(value)}
            />
            <BindingButton
                value={forNode.each()}
                locals={service.platform.shtml.getLocals(forNode.id())}
                accepts={$Tson.union({ union: [$Tson.array(), $Tson.object(), $Tson.record()] })}
            />
            <FormInputComponent
                type={'text'}
                label={'As'}
                value={forNode.as()}
                onChange={value => forNode.as(value)}
                error={'Required'}
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
    );
});
