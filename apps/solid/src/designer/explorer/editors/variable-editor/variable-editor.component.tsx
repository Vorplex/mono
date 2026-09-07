import { $Tson } from '@vorplex/core';
import { createStyle, defineRemountingComponent, useInjector, useStore } from '@vorplex/solid';
import { createMemo } from 'solid-js';
import { parse, stringify } from 'yaml';
import { FormInputComponent } from '../../../../components/forms/form-input.component';
import { PanelComponent } from '../../../../components/panel.component';
import { PlatformService } from '../../../../services/platform.service';
import { VariableScope } from '../../explorer.service';

const classes = createStyle(() => ({
    properties: {
        display: 'grid',
        gridAutoRows: 'max-content',
        overflowY: 'auto'
    },
}));

export const VariableEditorComponent = defineRemountingComponent((props: { variableId: string; scope: VariableScope }) => {

    const service = useInjector({
        platform: PlatformService
    });

    const drx = useStore(service.platform.drx.state);
    const variable = drx.variables[props.variableId];

    const scopedTypeIds = createMemo(() => {
        switch (props.scope.type) {
            case 'app':
            case 'page':
                return drx.app.typeIds();
            case 'component':
                return drx.components[props.scope.componentId].typeIds();
        }
    });

    const typeOptions = createMemo(() => {
        const options: Record<string, string> = Object.fromEntries($Tson.definitions.map(type => [type, type]));
        for (const typeId of scopedTypeIds()) {
            const type = drx.types[typeId];
            options[type.name()] = type.name();
        }
        return options;
    });

    return (
        <PanelComponent icon='variable' title='Variable Properties'>
            <div class={classes().properties}>
                <FormInputComponent
                    type={'dropdown'}
                    label={'Type'}
                    options={typeOptions()}
                    value={variable.type()}
                    onChange={value => variable.type(value)}
                />
                <FormInputComponent
                    type={'code'}
                    inline={true}
                    language={'yaml'}
                    label={'Value (YAML)'}
                    description={'The value assigned to the variable'}
                    value={stringify(variable.value())}
                    onChange={value => variable.value(value.trim() === '' ? undefined : parse(value))}
                />
            </div>
        </PanelComponent>
    );
});
