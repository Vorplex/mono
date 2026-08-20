import { useInjector, useStore } from '@vorplex/solid';
import { createResource, createSignal, onCleanup, onMount } from 'solid-js';
import { PlatformService } from '../../services/platform.service';
import { Theme } from '../../consts/theme';

export function PreviewComponent() {

    const service = useInjector({
        platform: PlatformService,
    });

    const shtml = useStore(service.platform.shtml.state);

    let frame!: HTMLIFrameElement;
    const [mounted, setMounted] = createSignal(false);
    onMount(() => {
        setMounted(true);
        const frameDocument = frame.contentDocument!;
        const base = frameDocument.createElement('base');
        base.href = 'about:blank';
        frameDocument.head.appendChild(base);
        frameDocument.body.style.margin = '0';
    });

    let dispose: (() => void) | undefined;
    onCleanup(() => dispose?.());

    createResource(
        () => mounted(),
        async () => {
            dispose?.();
            dispose = undefined;
            const preview = await service.platform.shtml.mount(frame.contentDocument.body);
            dispose = () => preview.dispose();
        }
    );

    return <iframe ref={frame} style={{ display: 'block', width: '100%', height: '100%', 'background-color': 'white', "border-radius": '5px', border: `1px solid ${Theme().outline.primary}` }} />;
}
