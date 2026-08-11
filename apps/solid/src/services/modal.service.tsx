import { $Object, Injectable, State, type Injector } from '@vorplex/core';
import { createPortal, ForIn, InjectorContext, Portal, useStore } from '@vorplex/solid';
import { useContext } from 'solid-js';
import { ButtonComponent } from '../components/button.component';
import { FormInputComponent, FormInputs } from '../components/forms/form-input.component';
import { ModalComponent, ModalComponentProps } from '../components/modal.component';

@Injectable({ global: true })
export class ModalService {

    public show<T = void>(options?: { injector?: Injector; modal: (modal: { portal: Portal, resolve: (value?: T) => void }) => ModalComponentProps }): Promise<T> & { portal: Portal } {
        const injector = useContext(InjectorContext);
        options = $Object.getDefaults(options, { injector });
        let resolver: (value?: T) => void;
        const result = new Promise<T>(innerResolve => resolver = innerResolve);
        const portal = createPortal({
            onDestroy: () => resolver(),
            render: (portal) => {
                const resolve = (value?: T) => {
                    resolver(value);
                    portal.destroy();
                };
                return (
                    <InjectorContext.Provider value={options.injector}>
                        <ModalComponent {...options?.modal({ portal, resolve })} onDismiss={() => portal.destroy()} />
                    </InjectorContext.Provider>
                );
            }
        });
        return Object.assign(result, { portal });
    }

    public showForm<T extends Record<string, FormInputs>>(options: { title: string; form: T | State<T> }): Promise<{ [K in keyof T]: T[K]['value'] } | null> {
        return new Promise((resolve) => {
            createPortal({
                render: (portal) => {
                    const formState = options.form instanceof State ? options.form : new State(options.form);
                    const state = useStore(formState);

                    return (
                        <ModalComponent
                            onDismiss={() => {
                                portal.destroy();
                                resolve(null);
                            }}
                            backdropDismissal={true}
                            header={options.title}
                            body={
                                <div style={{ display: 'grid', "grid-auto-rows": 'max-content', gap: '5px', overflow: 'auto', height: '100%', 'min-width': '33vw' }}>
                                    <ForIn each={state()}>
                                        {(input, key) => {
                                            return (
                                                <FormInputComponent
                                                    {...input()}
                                                    value={input().value as any}
                                                    onChange={async (value) => {
                                                        const validation = await input().validate?.(value as never);
                                                        formState.update((state) => ({
                                                            [key]: {
                                                                ...state[key],
                                                                value,
                                                                error: validation?.error,
                                                                warning: validation?.warning,
                                                            },
                                                        }) as T);
                                                        input().onChange?.(value as never);
                                                    }}
                                                />
                                            );
                                        }}
                                    </ForIn>
                                </div>
                            }
                            footer={
                                <>
                                    <ButtonComponent
                                        label={'Cancel'}
                                        onClick={() => {
                                            portal.destroy();
                                            resolve(null);
                                        }}
                                    />
                                    <ButtonComponent
                                        intent={'accent'}
                                        label={'Ok'}
                                        onClick={async () => {
                                            for (const key in formState.value) {
                                                const input = formState.value[key] as FormInputs;
                                                const validation = await input.validate?.(input.value as never);
                                                formState.update((state) => ({
                                                    [key]: {
                                                        ...state[key],
                                                        error: validation?.error,
                                                        warning: validation?.warning,
                                                    },
                                                }) as T);
                                            }
                                            if (Object.values(formState.value).some((input) => !input.hidden && input.error)) return;
                                            portal.destroy();
                                            resolve(
                                                Object.entries(formState.value).reduce(
                                                    (state, [key, input]) => ({
                                                        ...state,
                                                        [key]: input.value,
                                                    }),
                                                    {},
                                                ) as Record<keyof T, any>,
                                            );
                                        }}
                                    />
                                </>
                            }
                        />
                    );
                }
            });
        });
    }

}
