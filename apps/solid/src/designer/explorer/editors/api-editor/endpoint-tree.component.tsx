import { For, Show } from 'solid-js';
import { createStyle, defineComponent, useCachedSignal, useInjector, useStore } from '@vorplex/solid';
import { classNames } from '@vorplex/web';
import { Theme } from '../../../../consts/theme';
import { PlatformService } from '../../../../services/platform.service';

const classes = createStyle(() => ({
    tree: {
        background: Theme().secondary.color,
        color: Theme().secondary.text
    },
    item: {
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        padding: '5px 10px',
        '&.selected': {
            boxShadow: Theme().hoverShadow,
        },
        '&:hover': {
            cursor: 'pointer',
            boxShadow: Theme().hoverShadow,
        }
    },
    label: {
        display: 'flex',
        flex: '1 1 auto',
        gap: '5px',
        minWidth: '0',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis'
    }
}));

const SelectedEndpointIdCacheKey = Symbol();

export const EndpointEditorTreeComponent = defineComponent((props: { apiId: string }) => {
    const service = useInjector({
        platform: PlatformService,
    });

    const shtml = useStore(service.platform.shtml.state);
    const api = shtml.apis[props.apiId];
    const [selectedEndpointId, setSelectedEndpointId] = useCachedSignal<string>(SelectedEndpointIdCacheKey);

    const EndpointItem = defineComponent((props: { id: string }) => {
        const endpoint = shtml.apiEndpoints[props.id];
        return (
            <Show when={endpoint.id()}>
                <div
                    class={classNames(classes().item, { selected: selectedEndpointId() === props.id })}
                    onClick={() => setSelectedEndpointId(endpoint.id())}
                >
                    <span class={classes().label}>
                        <span style={{ color: Theme().accent.color }}>{endpoint.method()}</span>
                        <span>{endpoint.name()}</span>
                        <span style={{ color: Theme().secondary.subText }}>{endpoint.path()}</span>
                    </span>
                </div>
            </Show>
        );
    });

    return (
        <div class={classes().tree}>
            <Show when={api.id()}>
                <For each={api.endpointIds()}>{id => <EndpointItem id={id} />}</For>
            </Show>
        </div>
    );
});
