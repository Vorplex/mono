import { useInjector } from '@vorplex/solid';
import * as monaco from 'monaco-editor';
import { createEffect, createSignal, onCleanup, onMount, Show } from 'solid-js';
import { Theme } from '../../consts/theme';
import { MonacoService } from './monaco.service';

export function MonacoComponent(props: { readonly?: boolean; simple?: boolean; value: string; uri?: string; language?: string; onChanging?: (value: string) => void, onChange?: (value: string) => void }) {
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
        model?.dispose();
    });

    createEffect(() => model && model.getValue() !== props.value && model.setValue(props.value ?? ''));

    createEffect(() => {
        const language = props.language ?? 'typescript';
        if (model && model.getLanguageId() !== language) monaco.editor.setModelLanguage(model, language);
    });

    createEffect(() => editor?.updateOptions({
        readOnly: props.readonly,
        glyphMargin: !props.simple,
        folding: !props.simple,
        lineDecorationsWidth: props.simple ? 5 : 10,
        lineNumbersMinChars: props.simple ? 0 : 5,
        minimap: { enabled: !props.simple }
    }));

    return (
        <Show when={initialized}>
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    overflow: 'hidden',
                    border: `1px solid ${Theme().outline.primary}`,
                    'border-radius': '5px'
                }}
                ref={(element) => {
                    model = monaco.editor.createModel(props.value ?? '', props.language ?? 'typescript', props.uri ? monaco.Uri.parse(props.uri) : null);
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
}