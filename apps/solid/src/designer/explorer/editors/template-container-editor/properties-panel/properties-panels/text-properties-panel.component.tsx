import { $Tson } from '@vorplex/core';
import { createStyle, defineRemountingComponent, useInjector, useStore } from '@vorplex/solid';
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

export const TextPropertiesPanelComponent = defineRemountingComponent((props: { textId: string }) => {

    const service = useInjector({
        platform: PlatformService
    });

    const drx = useStore(service.platform.drx.state);
    const text = drx.texts[props.textId];

    return (
        <PanelComponent icon='type' title='Text Properties'>
            <div class={classes().properties}>
                <FieldComponent label={'Content'}>
                    <ExpressionInputComponent
                        value={text.content()}
                        accepts={$Tson.string()}
                        locals={service.platform.drx.getLocals(props.textId)}
                        onChange={value => text.content(value)}
                    />
                </FieldComponent>
            </div>
        </PanelComponent>
    );
});
