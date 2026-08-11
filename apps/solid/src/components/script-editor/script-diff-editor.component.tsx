import { defineComponent, useInjector } from '@vorplex/solid';
import * as monaco from 'monaco-editor';
import { createEffect, createSignal, onCleanup, onMount, Show } from 'solid-js';
import { Theme } from '../../consts/theme';
import { MonacoService } from './monaco.service';

export const MonacoDiffComponent = defineComponent((props: { markers?: monaco.editor.IMarkerData[], scrollPosition?: { top: number, left: number }, original: string; modified: string; language?: string; readonly?: boolean, inline?: boolean, hideUnchangedRegions?: boolean, onChanging?: (value: string) => void, onChange?: (value: string) => void, onScroll?: (event: monaco.IScrollEvent) => void }) => {
    const services = useInjector({
        monaco: MonacoService,
    });

    let editor: monaco.editor.IStandaloneDiffEditor;
    let original: monaco.editor.ITextModel;
    let modified: monaco.editor.ITextModel;

    const [initialized, setInitialized] = createSignal(false);

    const setModels = (originalValue: string, modifiedValue: string) => {
        if (original && modified) {
            original.setValue(originalValue);
            modified.setValue(modifiedValue);
        } else {
            original = monaco.editor.createModel(originalValue, props.language ?? 'typescript');
            modified = monaco.editor.createModel(modifiedValue, props.language ?? 'typescript');
            modified.onDidChangeContent(() => props.onChanging?.(modified.getValue()));
        }
        editor.setModel({ original, modified });
    };

    onMount(async () => {
        await services.monaco.init();
        setInitialized(true);
    });
    createEffect(() => {
        if (!initialized()) return;
        createEffect(() => original.getValue() !== props.original && setModels(props.original, props.modified));
        createEffect(() => modified.getValue() !== props.modified && modified.setValue(props.modified));
        createEffect(() => editor.updateOptions({ readOnly: props.readonly }));
        createEffect(() => editor.updateOptions({ renderSideBySide: !props.inline }));
        createEffect(() => editor.updateOptions({ hideUnchangedRegions: { enabled: props.hideUnchangedRegions } }));
        createEffect(() => {
            const position = props.scrollPosition;
            if (!position) return;
            editor.getModifiedEditor().setScrollPosition({ scrollLeft: position.left, scrollTop: position.top });
        });
        createEffect(() => {
            const lineCount = modified.getLineCount();
            const markers = (props.markers ?? []).map(marker => ({
                ...marker,
                startLineNumber: Math.min(marker.startLineNumber, lineCount),
                endLineNumber: Math.min(marker.endLineNumber, lineCount),
            }));
            monaco.editor.setModelMarkers(modified, 'validation', markers);
        });
    });
    onCleanup(() => editor?.dispose());

    return (
        <>
            <Show when={initialized}>
                <div
                    style={{ width: '100%', height: '100%', border: `1px solid ${Theme().outline.primary}` }}
                    ref={(element) => {
                        editor = monaco.editor.createDiffEditor(element, {
                            automaticLayout: true,
                            readOnly: props.readonly,
                            renderMarginRevertIcon: false,
                            renderSideBySide: !props.inline,
                            diffAlgorithm: 'advanced',
                            hideUnchangedRegions: { enabled: !!props.hideUnchangedRegions },
                        });
                        setModels(props.original, props.modified);
                        editor.onDidUpdateDiff(() => {
                            editor.updateOptions({ hideUnchangedRegions: { enabled: !!props.hideUnchangedRegions } });
                        });
                        const model = editor.getModifiedEditor();
                        model.onDidBlurEditorWidget(() => {
                            const value = modified.getValue();
                            if (value !== props.modified) {
                                props.onChange?.(value);
                            }
                        });
                        model.onDidScrollChange(event => props.onScroll?.(event));
                    }}
                />
            </Show>
        </>
    );
});
