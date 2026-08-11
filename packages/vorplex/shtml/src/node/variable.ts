import { $Id, $Tson, State, type TsonResult } from '@vorplex/core';
import { ShtmlDocumentState } from '../shtml';
import { ShtmlDom } from '../shtml-dom';
import { ShtmlDefinition } from './definition';
import { NodeType } from './node-type';

export interface ShtmlVariable {
    id: string;
    name: string;
    definition: string;
    value?: any;
}

export interface VariableApi<T = any> {
    get(): T;
    set(update: T | ((value: T) => T)): void;
    reset(): void;
    validate(): TsonResult<T>;
}

export const ShtmlVariable = {
    from(parent: Element, state: ShtmlDocumentState): ShtmlVariable[] {
        const elements = Array.from(parent.querySelectorAll(`:scope > ${NodeType.Variable}`));
        return elements.map(element => ShtmlVariable.parse(element, state));
    },
    parse(element: Element, state: ShtmlDocumentState): ShtmlVariable {
        const variable: ShtmlVariable = {
            id: ShtmlDom.getAttribute(element, 'id') ?? $Id.guid(),
            name: ShtmlDom.getRequiredAttribute(element, 'name'),
            definition: ShtmlDom.getAttribute(element, 'type') ?? 'any',
            value: ShtmlDom.getJsonContent(element)
        };
        state.variables[variable.id] = variable;
        return variable;
    },
    to(variable: ShtmlVariable): Element {
        const element = document.createElement(NodeType.Variable);
        element.setAttribute('id', variable.id);
        element.setAttribute('name', variable.name);
        element.setAttribute('type', variable.definition);
        if (variable.value != null) ShtmlDom.setJsonContent(element, variable.value);
        return element;
    },
    // Same underlying State per variable -- `locals` stays the bare template-facing signal, `states` lets
    // script-side wrappers (get/set/reset/validate) observe and mutate the exact same instance.
    instantiate(variables: ShtmlVariable[]): { locals: Record<string, any>; states: Map<string, State<any>> } {
        const states = new Map(variables.map(variable => [variable.id, new State(variable.value)] as const));
        const locals = variables.reduce((locals, variable) => Object.assign(locals, { [variable.name]: states.get(variable.id).signal.proxy }), {} as Record<string, any>);
        return { locals, states };
    },
    // The shtml.<scope>.variables.<name> surface (get/set/reset/validate) -- a separate wrapper around the
    // same State instances instantiate() already created, so a script's .set() and a template's {{ }} binding
    // observe the same state.
    createApi(variables: ShtmlVariable[], states: Map<string, State<any>>, definitions: ShtmlDefinition[]): Record<string, VariableApi> {
        return variables.reduce((api, variable) => {
            const state = states.get(variable.id)!;
            return Object.assign(api, {
                [variable.name]: {
                    get: () => state.value,
                    set: (update: any) => state.set(update),
                    reset: () => state.set(variable.value),
                    validate: () => $Tson.parse(ShtmlDefinition.resolve(variable.definition, definitions)).parse(state.value)
                } satisfies VariableApi
            });
        }, {} as Record<string, VariableApi>);
    }
};
