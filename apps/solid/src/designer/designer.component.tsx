import { Match, Show, Switch } from 'solid-js';
import { createStyle, useInjector, useStore } from '@vorplex/solid';
import { RadioButtonComponent } from '../components/radio-button.component';
import { Theme } from '../consts/theme';
import { PlatformService } from '../services/platform.service';
import { ExplorerComponent } from './explorer/explorer.component';
import { ExplorerService } from './explorer/explorer.service';
import { PreviewComponent } from './preview/preview.component';

const classes = createStyle(() => ({
    container: {
        display: 'grid',
        gridTemplateRows: 'max-content auto',
        overflow: 'hidden'
    },
    header: {
        display: 'flex',
        justifyContent: 'end',
        gap: '5px',
        padding: '5px',
        background: Theme().primary.color,
        color: Theme().primary.text,
        overflow: 'hidden'
    }
}));

export function DesignerComponent() {

    const service = useInjector({
        platform: PlatformService,
        explorer: ExplorerService
    });

    const shtml = useStore(service.platform.shtml.state);
    const explorerStore = useStore(service.explorer.state);

    return (
        <Show when={shtml()}>
            <div class={classes().container}>
                <div class={classes().header}>
                    <RadioButtonComponent
                        options={[
                            {
                                icon: 'pencil-ruler',
                                label: 'Design',
                                value: 'design'
                            },
                            {
                                icon: 'play',
                                label: 'Preview',
                                value: 'preview'
                            }
                        ] as const}
                        value={explorerStore.mode()}
                        onChange={value => explorerStore.mode(value)}
                    />
                </div>
                <Switch>
                    <Match when={explorerStore.mode() === 'design'}>
                        <ExplorerComponent />
                    </Match>
                    <Match when={explorerStore.mode() === 'preview'}>
                        <PreviewComponent />
                    </Match>
                </Switch>
            </div>
        </Show>
    );

}