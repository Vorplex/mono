import { useInjector, useStore } from '@vorplex/solid';
import { createResource, createSignal, onCleanup, onMount } from 'solid-js';
import { Theme } from '../../consts/theme';
import { ModalService } from '../../services/modal.service';
import { PlatformService } from '../../services/platform.service';

export function PreviewComponent() {

    const service = useInjector({
        platform: PlatformService,
        modal: ModalService
    });

    const drx = useStore(service.platform.drx.state);

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
            try {
                const preview = await service.platform.drx.mount(frame.contentDocument.body);
                dispose = () => preview.dispose();
            } catch (error) {
                await service.modal.showError(error);
            }
        }
    );

    return <iframe ref={frame} style={{ display: 'block', width: '100%', height: '100%', 'background-color': 'white', "border-radius": '5px', border: `1px solid ${Theme().outline.primary}` }} />;
}
