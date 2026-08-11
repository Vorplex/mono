import { defineComponent, useInjector } from '@vorplex/solid';
import * as monaco from 'monaco-editor';
import { createEffect, createSignal, onCleanup, onMount, Show } from 'solid-js';
import { Theme } from '../../consts/theme';
import { MonacoService } from './monaco.service';

export const MonacoComponent = defineComponent((props: { readonly?: boolean; simple?: boolean; value: string; uri?: string; language?: string; onChanging?: (value: string) => void, onChange?: (value: string) => void }) => {
    const services = useInjector({
        monaco: MonacoService,
    });

    let editor: monaco.editor.IStandaloneCodeEditor;
    let model: monaco.editor.ITextModel;

    const [initialized, setInitialized] = createSignal(false);

    onMount(async () => {
        await services.monaco.init();
        setInitialized(true);
    });

    onCleanup(() => {
        editor?.dispose();
    });

    createEffect(() => model && model.getValue() !== props.value && model.setValue(props.value ?? ''));

    return (
        <Show when={initialized}>
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    overflow: 'hidden',
                    border: `1px solid ${Theme().outline.primary}`
                }}
                ref={(element) => {
                    model = monaco.editor.createModel(props.value, props.language ?? 'typescript', props.uri ? monaco.Uri.parse(props.uri) : null);
                    let changes: boolean;
                    model.onDidChangeContent((event) => {
                        changes = true;
                        props.onChanging?.(model.getValue());
                    });
                    editor = monaco.editor.create(element, {
                        ...(props.simple
                            ? {
                                glyphMargin: false,
                                folding: false,
                                lineDecorationsWidth: 5,
                                lineNumbersMinChars: 0,
                                minimap: {
                                    enabled: false,
                                },
                            }
                            : {}),
                        model,
                        automaticLayout: true,
                        readOnly: props.readonly,
                    });
                    editor.onDidBlurEditorText(() => {
                        if (changes) {
                            changes = false;
                            props.onChange?.(model.getValue());
                        }
                    });
                }}
            />
        </Show>
    );
});
