import { DrxDocument } from '@vorplex/drx';
import { createStyle, useInjector, useStore } from '@vorplex/solid';
import { createSignal, Match, Show, Switch } from 'solid-js';
import { RadioButtonComponent } from '../components/radio-button.component';
import { MonacoComponent } from '../components/script-editor/monaco.component';
import { Theme } from '../consts/theme';
import { ModalService } from '../services/modal.service';
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
        explorer: ExplorerService,
        modal: ModalService
    });

    const drx = useStore(service.platform.drx.state);
    const explorerStore = useStore(service.explorer.state);
    const [raw, setRaw] = createSignal(service.platform.drx.toFormattedString());

    return (
        <Show when={drx()}>
            <div class={classes().container}>
                <div class={classes().header}>
                    <RadioButtonComponent
                        options={[
                            {
                                icon: 'code-xml',
                                label: 'DRX',
                                value: 'drx'
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
                        onChange={async value => {
                            if (explorerStore.mode() === 'drx') {
                                try {
                                    service.platform.drx.state.set(DrxDocument.parse(raw()).state.value);
                                } catch (error) {
                                    await service.modal.showError(error);
                                    throw error;
                                }
                            } else if (value === 'drx') {
                                setRaw(service.platform.drx.toFormattedString());
                            }
                            explorerStore.mode(value);
                        }}
                    />
                </div>
                <Switch>
                    <Match when={explorerStore.mode() === 'drx'}>
                        <div class={classes().content}>
                            <MonacoComponent
                                language='html'
                                value={raw()}
                                onChange={value => setRaw(value)}
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