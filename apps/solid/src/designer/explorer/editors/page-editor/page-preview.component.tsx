import { ExpressionDisplay, NodeType } from '@vorplex/shtml';
import { defineComponent, useInjector, useStore } from '@vorplex/solid';
import { createResource, createSignal, onCleanup, onMount } from 'solid-js';
import { PlatformService } from '../../../../services/platform.service';
import { PageEditorService } from './page-editor.service';


export const PagePreviewComponent = defineComponent((props: { pageId: string }) => {

    const service = useInjector({
        platform: PlatformService,
        pageEditor: PageEditorService
    });

    const shtml = useStore(service.platform.shtml.state);

    let frame!: HTMLIFrameElement;
    const [mounted, setMounted] = createSignal(false);
    onMount(() => {
        setMounted(true);
        const frameDocument = frame.contentDocument!;
        frameDocument.body.style.margin = '0';
        frameDocument.addEventListener('click', event => {
            event.preventDefault();
            const chain = event.composedPath().filter((node): node is HTMLElement => node instanceof HTMLElement && node.hasAttribute('data-shtml-id'));
            const target = chain[0];
            if (!target) return;
            const ids = chain.map(node => node.getAttribute('data-shtml-id')!).reverse();
            service.pageEditor.state.update({ selectedTreeItem: { type: NodeType.Element, id: ids[ids.length - 1], path: ids.slice(0, -1) } });
        });
        frameDocument.addEventListener('dblclick', event => {
            const target = event.composedPath().find((node): node is HTMLElement => node instanceof HTMLElement && node.hasAttribute('data-shtml-id'));
            if (!target) return;
            const id = target.getAttribute('data-shtml-id')!;
            const template = shtml.elements[id].template();
            if (template.length !== 1 || template[0].kind !== NodeType.Text) return;
            const textId = template[0].id;
            const textNode = target.firstChild as Text;

            event.preventDefault();
            const raw = shtml.texts[textId].content();
            textNode.data = raw;
            target.contentEditable = 'true';
            target.focus();
            const range = frameDocument.createRange();
            range.selectNodeContents(target);
            const selection = frame.contentWindow!.getSelection();
            selection?.removeAllRanges();
            selection?.addRange(range);

            function stop() {
                target.contentEditable = 'false';
                target.removeEventListener('blur', commit);
                target.removeEventListener('keydown', onKeyDown);
            }
            function commit() {
                stop();
                const value = textNode.data;
                shtml.texts[textId].content(value);
                textNode.data = ExpressionDisplay.mask(value);
            }
            function cancel() {
                stop();
                textNode.data = ExpressionDisplay.mask(raw);
                target.blur();
            }
            function onKeyDown(keyDownEvent: KeyboardEvent) {
                if (keyDownEvent.key === 'Enter' && !keyDownEvent.shiftKey) { keyDownEvent.preventDefault(); target.blur(); }
                else if (keyDownEvent.key === 'Escape') { keyDownEvent.preventDefault(); cancel(); }
            }
            target.addEventListener('blur', commit, { once: true });
            target.addEventListener('keydown', onKeyDown);
        });
    });

    let dispose: (() => void) | undefined;
    onCleanup(() => dispose?.());

    createResource(
        () => mounted() && props.pageId,
        async (pageName) => {
            dispose?.();
            dispose = undefined;
            const preview = await service.platform.shtml.preview(frame.contentDocument!.body, {
                target: { type: 'page', id: props.pageId },
                styleSheets: [
                    () => '[data-shtml-id]:hover:not(:has([data-shtml-id]:hover)) { outline: 2px solid #7d8cff; outline-offset: -1px; cursor: pointer; }',
                    () => {
                        const hovered = service.pageEditor.state.signal.proxy.hoveredTreeItem();
                        return hovered?.type === NodeType.Element ? `[data-shtml-id="${hovered.id}"] { outline: 2px solid #7d8cff; outline-offset: -1px; }` : '';
                    }
                ]
            });
            dispose = () => preview.dispose();
        }
    );

    return <iframe ref={frame} style={{ display: 'block', width: '100%', height: '100%', border: 'none', 'background-color': 'white' }} />;
});
