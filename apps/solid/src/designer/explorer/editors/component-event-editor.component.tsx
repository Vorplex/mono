import { $Tson } from '@vorplex/core';
import { createStyle, defineRemountingComponent, useInjector, useStore } from '@vorplex/solid';
import { createMemo } from 'solid-js';
import { FormInputComponent } from '../../../components/forms/form-input.component';
import { DropdownOption } from '../../../components/forms/inputs/dropdown.component';
import { PanelComponent } from '../../../components/panel.component';
import { PlatformService } from '../../../services/platform.service';

const classes = createStyle(() => ({
    properties: {
        display: 'grid',
        gridAutoRows: 'max-content',
        overflowY: 'auto'
    },
}));

export const ComponentEventEditorComponent = defineRemountingComponent((props: { eventId: string; componentId: string }) => {

    const service = useInjector({
        platform: PlatformService
    });

    const drx = useStore(service.platform.drx.state);
    const event = drx.componentEvents[props.eventId];
    const component = drx.components[props.componentId];

    const typeOptions = createMemo(() => {
        const options: DropdownOption[] = $Tson.definitions.map(type => ({ key: type, value: type }));
        for (const typeId of component.typeIds()) {
            const type = drx.types[typeId];
            options.push({ key: type.name(), value: type.name(), group: component.name() });
        }
        return options;
    });

    return (
        <PanelComponent icon='zap' title='Component Event'>
            <div class={classes().properties}>
                <FormInputComponent
                    type={'dropdown'}
                    label={'Type'}
                    options={typeOptions()}
                    value={event.type()}
                    onChange={value => event.type(value)}
                />
            </div>
        </PanelComponent>
    );
});
