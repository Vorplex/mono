import { $String } from '@vorplex/core';
import { createStyle, defineRemountingComponent, useInjector, useStore } from '@vorplex/solid';
import { FormInputComponent } from '../../../../components/forms/form-input.component';
import { PanelComponent } from '../../../../components/panel.component';
import { PlatformService } from '../../../../services/platform.service';

const classes = createStyle(() => ({
    container: {
        display: 'grid',
        gridAutoRows: 'max-content',
        gap: '5px',
        overflow: 'auto',
        padding: '10px'
    }
}));

export const ApiEditorComponent = defineRemountingComponent((props: { apiId: string }) => {

    const service = useInjector({
        platform: PlatformService
    });

    const shtml = useStore(service.platform.shtml.state);
    const api = shtml.apis[props.apiId];

    return (
        <PanelComponent icon='globe' title='Api Properties'>
            <div class={classes().container}>
                <FormInputComponent
                    type={'text'}
                    label={'URL'}
                    placeholder={'https://...'}
                    value={api.url()}
                    onChange={value => api.url(value)}
                    error={$String.isNullOrEmpty(api.url()) ? 'Required' : null}
                />
            </div>
        </PanelComponent>
    );
});
