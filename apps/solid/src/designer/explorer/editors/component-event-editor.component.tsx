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

export const ComponentEventEditorComponent = defineRemountingComponent((props: { eventId: string; componentId: string }) => {

    const service = useInjector({
        platform: PlatformService
    });

    const shtml = useStore(service.platform.shtml.state);
    const event = shtml.componentEvents[props.eventId];
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
