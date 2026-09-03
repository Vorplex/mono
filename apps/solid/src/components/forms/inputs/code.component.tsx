import { useInjector } from '@vorplex/solid';
import { createSignal } from 'solid-js';
import { YAMLParseError } from 'yaml';
import { ModalService } from '../../../services/modal.service';
import { ButtonComponent } from '../../button.component';
import { MonacoComponent } from '../../script-editor/monaco.component';
import { ModalFormInputComponent } from './modal.component';

export interface CodeFormInput {
    label?: string;
    disabled?: boolean;
    value?: string;
    language: 'yaml' | 'json' | 'typescript';
    onChange?: (value: string) => void;
}

export function CodeFormInputComponent(props: CodeFormInput) {
    const services = useInjector({
        modal: ModalService
    });

    return (
        <ModalFormInputComponent
            modal={modal => {
                const [value, setValue] = createSignal(props.value);
                return {
                    backdropDismissal: true,
                    header: props.label,
                    body: (
                        <div style={{
                            width: '80vw',
                            height: '80vh',
                            'max-width': '100%',
                            'max-height': '100%',
                            overflow: 'hidden'
                        }}>
                            <MonacoComponent
                                language={props.language}
                                value={value()}
                                onChange={value => setValue(value)}
                            />
                        </div>
                    ),
                    footer: (
                        <>
                            <ButtonComponent
                                label={'Cancel'}
                                onClick={() => modal.resolve()}
                            />
                            <ButtonComponent
                                intent={'accent'}
                                label={'Ok'}
                                onClick={() => {
                                    try {
                                        props.onChange?.(value());
                                        modal.resolve();
                                    } catch (error) {
                                        if (error instanceof YAMLParseError) {
                                            services.modal.showError(error);
                                            return;
                                        }
                                        throw error;
                                    }
                                }}
                            />
                        </>
                    )
                };
            }}
        />
    );
}
