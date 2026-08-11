import { defineComponent, useInjector, useStore } from '@vorplex/solid';
import { createMemo } from 'solid-js';
import { FormInputComponent } from '../../../../../../components/forms/form-input.component';
import { PlatformService } from '../../../../../../services/platform.service';

export const PageContainerPropertiesPanelComponent = defineComponent((props: { pageContainerId: string }) => {

    const service = useInjector({
        platform: PlatformService
    });

    const shtml = useStore(service.platform.shtml.state);
    const pageContainer = shtml.pageContainers[props.pageContainerId];
    const pages = createMemo(() => Object.values(shtml.pages()).reduce((pages, page) => Object.assign(pages, { [page.name]: page.name }), {}));

    return (
        <div>
            <FormInputComponent
                type={'dropdown'}
                label={'Page'}
                options={pages()}
                value={pageContainer.page()}
                onChange={value => pageContainer.page(value)}
            />
        </div>
    );
});
