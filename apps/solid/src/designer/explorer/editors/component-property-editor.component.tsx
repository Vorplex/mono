import { $Tson } from '@vorplex/core';
import { createStyle, defineRemountingComponent, useInjector, useStore } from '@vorplex/solid';
import { createMemo } from 'solid-js';
import { FormInputComponent } from '../../../components/forms/form-input.component';
import { PanelComponent } from '../../../components/panel.component';
import { PlatformService } from '../../../services/platform.service';

const classes = createStyle(() => ({
    properties: {
        display: 'grid',
        gridAutoRows: 'max-content',
        overflowY: 'auto'
    },
}));

export const ComponentPropertyEditorComponent = defineRemountingComponent((props: { propertyId: string; componentId: string }) => {

    const service = useInjector({
        platform: PlatformService
    });

    const shtml = useStore(service.platform.shtml.state);
    const property = shtml.componentProperties[props.propertyId];
    const component = shtml.components[props.componentId];

    const typeOptions = createMemo(() => {
        const options: Record<string, string> = Object.fromEntries($Tson.definitions.map(type => [type, type]));
        for (const typeId of component.typeIds()) {
            const type = shtml.types[typeId];
            options[type.name()] = type.name();
        }
        return options;
    });

    return (
        <PanelComponent icon='list' title='Component Property'>
            <div class={classes().properties}>
                <FormInputComponent
                    type={'dropdown'}
                    label={'Type'}
                    options={typeOptions()}
                    value={property.type()}
                    onChange={value => property.type(value)}
                />
            </div>
        </PanelComponent>
    );
});
