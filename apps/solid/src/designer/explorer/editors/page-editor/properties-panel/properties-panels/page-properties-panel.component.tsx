import { defineComponent, useInjector, useStore } from '@vorplex/solid';
import { Classes } from '../../../../../../consts/theme';
import { PlatformService } from '../../../../../../services/platform.service';
import { PanelComponent } from '../../../../../../components/panel.component';

export const PagePropertiesPanelComponent = defineComponent((props: { pageId: string }) => {

    const service = useInjector({
        platform: PlatformService
    });

    const shtml = useStore(service.platform.shtml.state);
    const page = shtml.pages[props.pageId];

    return (
        <PanelComponent icon='sliders-horizontal' title='Page Properties'>
            <div style={{ padding: '10px', display: 'flex', 'flex-direction': 'column', gap: '10px' }}>
                <label style={{ display: 'flex', 'flex-direction': 'column', gap: '5px' }}>
                    <span>Name</span>
                    <input
                        class={Classes().input}
                        value={page.name()}
                        onChange={event => page.name(event.currentTarget.value)}
                    />
                </label>
            </div>
        </PanelComponent>
    );
});
