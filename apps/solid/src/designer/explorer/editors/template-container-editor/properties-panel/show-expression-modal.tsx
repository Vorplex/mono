import { TsonDefinition } from '@vorplex/core';
import { ExpressionParser } from '@vorplex/shtml';
import { createStyle, useInjector } from '@vorplex/solid';
import { createMemo, createSignal, For, Match, Switch } from 'solid-js';
import { ButtonComponent } from '../../../../../components/button.component';
import { MonacoComponent } from '../../../../../components/script-editor/monaco.component';
import { Theme } from '../../../../../consts/theme';
import { ModalService } from '../../../../../services/modal.service';
import { VariablePathSelectorComponent } from './variable-path-selector.component';

const classes = createStyle(() => ({
    body: {
        display: 'grid',
        gridAutoRows: 'max-content',
        gap: '10px',
        minWidth: '50vw'
    },
    tabs: {
        display: 'grid',
        gridAutoFlow: 'column',
        gridAutoColumns: 'max-content',
        gap: '5px'
    },
    selector: {
        height: '40vh'
    },
    expressionContainer: {
        display: 'grid',
        gridTemplateColumns: '200px auto',
        gridTemplateRows: '100%',
        overflow: 'hidden',
        border: `1px solid ${Theme().outline.primary}`,
        borderRadius: '5px',
        height: '100%'
    },
    expressionLocals: {
        display: 'grid',
        gridAutoRows: 'max-content',
        gap: '5px',
        overflow: 'auto',
        padding: '5px',
        borderRight: `1px solid ${Theme().outline.primary}`
    },
    expressionEditor: {
        display: 'grid',
        overflow: 'hidden',
        padding: '5px'
    }
}));

export function showExpressionModal(options: { value: string; locals: Record<string, TsonDefinition>; accepts?: TsonDefinition }): Promise<string | undefined> {
    const service = useInjector({ modal: ModalService });
    const localNames = Object.keys(options.locals);

    return service.modal.show<string | undefined>({
        modal: modal => {
            const local = ExpressionParser.isLocal(options.value ?? '');
            const isSimpleLocal = local != null && local.name in options.locals;

            const [tab, setTab] = createSignal<'local' | 'expression'>(isSimpleLocal ? 'local' : 'expression');
            const [variable, setVariable] = createSignal<string>(isSimpleLocal ? local.name : undefined);
            const [path, setPath] = createSignal(isSimpleLocal ? local.path : '');
            const [expression, setExpression] = createSignal(options.value ?? '');

            const localResult = createMemo(() => {
                const name = variable();
                if (!name) return undefined;
                const trimmedPath = path().trim();
                return `{{${name}${trimmedPath ? `.${trimmedPath}` : ''}()}}`;
            });

            const insertLocal = (name: string) => setExpression(current => `${current}{{${name}()}}`);

            return {
                header: 'Expression',
                backdropDismissal: true,
                onDismiss: () => modal.resolve(undefined),
                body: () => (
                    <div class={classes().body}>
                        <div class={classes().tabs}>
                            <ButtonComponent appearance='flat' selected={tab() === 'local'} label='Local' onClick={() => setTab('local')} />
                            <ButtonComponent appearance='flat' selected={tab() === 'expression'} label='Expression' onClick={() => setTab('expression')} />
                        </div>
                        <Switch>
                            <Match when={tab() === 'local'}>
                                <div class={classes().selector}>
                                    <VariablePathSelectorComponent
                                        locals={options.locals}
                                        selectableDefinition={options.accepts}
                                        selectedName={variable()}
                                        selectedPath={path()}
                                        preview={localResult()}
                                        onChange={(name, path) => { setVariable(name); setPath(path); }}
                                    />
                                </div>
                            </Match>
                            <Match when={tab() === 'expression'}>
                                <div class={classes().selector}>
                                    <div class={classes().expressionContainer}>
                                        <div class={classes().expressionLocals}>
                                            <For each={localNames}>
                                                {name => <ButtonComponent appearance='flat' label={name} style={{ 'justify-content': 'left' }} onClick={() => insertLocal(name)} />}
                                            </For>
                                        </div>
                                        <div class={classes().expressionEditor}>
                                            <MonacoComponent
                                                simple
                                                language={'text'}
                                                value={expression()}
                                                onChanging={value => setExpression(value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Match>
                        </Switch>
                    </div>
                ),
                footer: (
                    <>
                        <ButtonComponent label='Cancel' onClick={() => modal.resolve(undefined)} />
                        <ButtonComponent intent='accent' label='OK' onClick={() => modal.resolve(tab() === 'local' ? localResult() : expression())} />
                    </>
                )
            };
        }
    });
}
