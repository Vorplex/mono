import { ExpressionDisplay, NodeType } from '@vorplex/drx';
import { defineRemountingComponent, useInjector, useStore } from '@vorplex/solid';
import { createResource, createSignal, onCleanup, onMount } from 'solid-js';
import { PanelComponent } from '../../../../components/panel.component';
import { Theme } from '../../../../consts/theme';
import { PlatformService, TemplateContainerTarget } from '../../../../services/platform.service';

export const TemplateContainerPreviewComponent = defineRemountingComponent((props: { target: TemplateContainerTarget }) => {

    const service = useInjector({
        platform: PlatformService
    });

    const editorKey = props.target.id;
    const drx = useStore(service.platform.drx.state);

    let frame!: HTMLIFrameElement;
    const [mounted, setMounted] = createSignal(false);
    onMount(() => {
        setMounted(true);
        const frameDocument = frame.contentDocument!;
        frameDocument.body.style.margin = '0';
        frameDocument.addEventListener('click', event => {
            event.preventDefault();
            const target = event.composedPath().find((node): node is HTMLElement => node instanceof HTMLElement && node.hasAttribute('data-drx-id'));
            if (!target) return;
            const id = target.getAttribute('data-drx-id')!;
            service.platform.state.update(state => state.explorer.templateEditors[props.target.id], { selectedTreeItem: { type: NodeType.Element, id } });
        });
        frameDocument.addEventListener('dblclick', event => {
            const target = event.composedPath().find((node): node is HTMLElement => node instanceof HTMLElement && node.hasAttribute('data-drx-id'));
            if (!target) return;
            const id = target.getAttribute('data-drx-id')!;
            const template = drx.elements[id].template();
            if (template.length !== 1 || template[0].type !== NodeType.Text) return;
            const textId = template[0].id;
            const textNode = target.firstChild as Text;

            event.preventDefault();
            const raw = drx.texts[textId].content();
            textNode.data = raw;
            target.contentEditable = 'true';
            target.focus();
            const range = frameDocument.createRange();
            range.selectNodeContents(target);
            const selection = frame.contentWindow!.getSelection();
            selection?.removeAllRanges();
            selection?.addRange(range);

            const stop = () => {
                target.contentEditable = 'false';
                target.removeEventListener('blur', commit);
                target.removeEventListener('keydown', onKeyDown);
            };
            const commit = () => {
                stop();
                const value = textNode.data;
                drx.texts[textId].content(value);
                textNode.data = ExpressionDisplay.mask(value);
            };
            const cancel = () => {
                stop();
                textNode.data = ExpressionDisplay.mask(raw);
                target.blur();
            };
            const onKeyDown = (keyDownEvent: KeyboardEvent) => {
                if (keyDownEvent.key === 'Enter' && !keyDownEvent.shiftKey) { keyDownEvent.preventDefault(); target.blur(); }
                else if (keyDownEvent.key === 'Escape') { keyDownEvent.preventDefault(); cancel(); }
            };
            target.addEventListener('blur', commit, { once: true });
            target.addEventListener('keydown', onKeyDown);
        });
    });

    let dispose: (() => void) | undefined;
    onCleanup(() => dispose?.());

    createResource(
        () => mounted() && props.target,
        async () => {
            dispose?.();
            dispose = undefined;
            const preview = await service.platform.drx.preview(frame.contentDocument!.body, {
                target: props.target,
                styleSheets: [
                    () => '[data-drx-id]:hover:not(:has([data-drx-id]:hover)) { outline: 2px solid #7d8cff; outline-offset: -1px; cursor: pointer; }',
                    () => {
                        const hovered = service.platform.state.signal.proxy.explorer.templateEditors[editorKey].hoveredTreeItem();
                        return hovered?.type === NodeType.Element ? `[data-drx-id="${hovered.id}"] { outline: 2px solid #7d8cff; outline-offset: -1px; }` : '';
                    },
                    () => {
                        const selected = service.platform.state.signal.proxy.explorer.templateEditors[editorKey].selectedTreeItem();
                        return selected?.type === NodeType.Element ? `[data-drx-id="${selected.id}"] { outline: 2px solid ${Theme().info.outline}; outline-offset: -1px; }` : '';
                    }
                ]
            });
            dispose = () => preview.dispose();
        }
    );

    return (
        <PanelComponent icon='pencil-ruler' title='Design'>
            <iframe ref={frame} style={{ display: 'block', width: '100%', height: '100%', border: 'none', 'background-color': 'white' }} />
        </PanelComponent>
    );
});
