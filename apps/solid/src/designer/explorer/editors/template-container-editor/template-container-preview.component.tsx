import { ExpressionDisplay, NodeType } from '@vorplex/shtml';
import { defineRemountingComponent, useInjector, useStore } from '@vorplex/solid';
import { createResource, createSignal, onCleanup, onMount, useContext } from 'solid-js';
import { PanelComponent } from '../../../../components/panel.component';
import { Theme } from '../../../../consts/theme';
import { PlatformService } from '../../../../services/platform.service';
import { TemplateContainerEditorContext, TemplateContainerTarget } from './template-container-editor-context';


export const TemplateContainerPreviewComponent = defineRemountingComponent((props: { target: TemplateContainerTarget }) => {

    const service = useInjector({
        platform: PlatformService
    });

    const editorState = useContext(TemplateContainerEditorContext);
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
            editorState.update({ selectedTreeItem: { type: NodeType.Element, id: ids[ids.length - 1], path: ids.slice(0, -1) } });
        });
        frameDocument.addEventListener('dblclick', event => {
            const target = event.composedPath().find((node): node is HTMLElement => node instanceof HTMLElement && node.hasAttribute('data-shtml-id'));
            if (!target) return;
            const id = target.getAttribute('data-shtml-id')!;
            const template = shtml.elements[id].template();
            if (template.length !== 1 || template[0].type !== NodeType.Text) return;
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

            const stop = () => {
                target.contentEditable = 'false';
                target.removeEventListener('blur', commit);
                target.removeEventListener('keydown', onKeyDown);
            };
            const commit = () => {
                stop();
                const value = textNode.data;
                shtml.texts[textId].content(value);
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
            const preview = await service.platform.shtml.preview(frame.contentDocument!.body, {
                target: props.target,
                styleSheets: [
                    () => '[data-shtml-id]:hover:not(:has([data-shtml-id]:hover)) { outline: 2px solid #7d8cff; outline-offset: -1px; cursor: pointer; }',
                    () => {
                        const hovered = editorState.signal.proxy.hoveredTreeItem();
                        return hovered?.type === NodeType.Element ? `[data-shtml-id="${hovered.id}"] { outline: 2px solid #7d8cff; outline-offset: -1px; }` : '';
                    },
                    () => {
                        const selected = editorState.signal.proxy.selectedTreeItem();
                        return selected?.type === NodeType.Element ? `[data-shtml-id="${selected.id}"] { outline: 2px solid ${Theme().info.outline}; outline-offset: -1px; }` : '';
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
