import { ShtmlAssetSource } from '@vorplex/shtml';
import { createStyle, defineRemountingComponent, useInjector, useStore } from '@vorplex/solid';
import { Match, Show, Switch } from 'solid-js';
import { FormInputComponent } from '../../../../components/forms/form-input.component';
import { MonacoComponent } from '../../../../components/script-editor/script-editor.component';
import { PlatformService } from '../../../../services/platform.service';

const classes = createStyle(() => ({
    container: {
        display: 'grid',
        gridTemplateRows: 'max-content 1fr',
        gap: '5px',
        overflow: 'hidden'
    }
}));

export const AssetEditorComponent = defineRemountingComponent((props: { assetId: string }) => {

    const service = useInjector({
        platform: PlatformService
    });

    const shtml = useStore(service.platform.shtml.state);
    const asset = shtml.assets[props.assetId];

    const editorLanguageMimeTypes: Record<string, string> = {
        'application/json': 'json',
        'text/css': 'css',
        'text/html': 'html',
        'image/svg+xml': 'xml',
        'text/javascript': 'javascript',
        'application/javascript': 'javascript',
        'text/yaml': 'yaml',
        'application/yaml': 'yaml'
    };

    return (
        <Show when={asset.id()}>
            <div class={classes().container}>
                <FormInputComponent
                    type={'dropdown'}
                    label={'Source'}
                    options={{ internal: 'Inline', external: 'External' }}
                    value={asset.source().type}
                    onChange={value => {
                        const source = asset.source();
                        if (value === 'external') {
                            asset.source({ type: 'external', url: source.type === 'external' ? source.url : '' });
                        } else {
                            asset.source({ type: 'internal', content: source.type === 'internal' ? source.content : '', mimeType: source.type === 'internal' ? source.mimeType : undefined });
                        }
                    }}
                />
                <Switch>
                    <Match when={asset.source().type === 'external'}>
                        <FormInputComponent
                            type={'text'}
                            inline={false}
                            label={'URL'}
                            placeholder={'https://...'}
                            value={(asset.source() as Extract<ShtmlAssetSource, { type: 'external' }>).url}
                            onChange={value => asset.source({ type: 'external', url: value })}
                        />
                    </Match>
                    <Match when={asset.source().type === 'internal'}>
                        <MonacoComponent
                            language={editorLanguageMimeTypes[(asset.source() as Extract<ShtmlAssetSource, { type: 'internal' }>).mimeType] ?? 'plaintext'}
                            value={(asset.source() as Extract<ShtmlAssetSource, { type: 'internal' }>).content ?? ''}
                            onChanging={value => {
                                const source = asset.source();
                                asset.source({ type: 'internal', content: value, mimeType: source.type === 'internal' ? source.mimeType : undefined });
                            }}
                        />
                    </Match>
                </Switch>
            </div>
        </Show>
    );
});
