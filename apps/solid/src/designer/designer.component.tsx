import { createStyle, useInjector, useStore } from '@vorplex/solid';
import { createMemo, Match, Show, Switch } from 'solid-js';
import { RadioButtonComponent } from '../components/radio-button.component';
import { MonacoComponent } from '../components/script-editor/script-editor.component';
import { Theme } from '../consts/theme';
import { PlatformService } from '../services/platform.service';
import { ExplorerComponent } from './explorer/explorer.component';
import { ExplorerService } from './explorer/explorer.service';
import { PreviewComponent } from './preview/preview.component';

const classes = createStyle(() => ({
    container: {
        display: 'grid',
        gridTemplateRows: 'max-content auto',
        gap: '5px',
        overflow: 'hidden',
        padding: '5px',
    },
    header: {
        display: 'flex',
        justifyContent: 'end',
        gap: '5px',
        padding: '5px',
        background: Theme().primary.color,
        color: Theme().primary.text,
        overflow: 'hidden',
        borderRadius: '5px',
        border: `1px solid ${Theme().outline.primary}`
    },
    content: {
        borderRadius: '5px',
        border: `1px solid ${Theme().outline.primary}`,
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
    const raw = createMemo(() => {
        shtml();
        return service.platform.shtml.toShtml();
    });

    return (
        <Show when={shtml()}>
            <div class={classes().container}>
                <div class={classes().header}>
                    <RadioButtonComponent
                        options={[
                            {
                                icon: 'code-xml',
                                label: 'SHTML',
                                value: 'shtml'
                            },
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
                    <Match when={explorerStore.mode() === 'shtml'}>
                        <div class={classes().content}>
                            <MonacoComponent
                                language='html'
                                value={raw()}
                            />
                        </div>
                    </Match>
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