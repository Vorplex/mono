import { createStyle, defineComponent, useInjector, useStore } from '@vorplex/solid';
import { createMemo } from 'solid-js';
import { FormInputComponent } from '../../../../../../components/forms/form-input.component';
import { PlatformService } from '../../../../../../services/platform.service';
import { PanelComponent } from '../../../../../../components/panel.component';

const classes = createStyle(() => ({
    properties: {
        display: 'grid',
        gridAutoRows: 'max-content',
        overflowY: 'auto'
    },
}));

export const PageContainerPropertiesPanelComponent = defineComponent((props: { pageContainerId: string }) => {

    const service = useInjector({
        platform: PlatformService
    });

    const shtml = useStore(service.platform.shtml.state);
    const pageContainer = shtml.pageContainers[props.pageContainerId];
    const pages = createMemo(() => Object.values(shtml.pages()).reduce((pages, page) => Object.assign(pages, { [page.name]: page.name }), {}));

    return (
        <PanelComponent icon='sliders-horizontal' title='Page Container Properties'>
            <div class={classes().properties}>
                <FormInputComponent
                    type={'dropdown'}
                    label={'Page'}
                    options={pages()}
                    value={pageContainer.page()}
                    onChange={value => pageContainer.page(value)}
                />
            </div>
        </PanelComponent>
    );
});
