import { $Id, $Tson, State, type TsonResult } from '@vorplex/core';
import { ShtmlDocumentState } from '../shtml';
import { ShtmlDom } from '../shtml-dom';
import { ShtmlType } from './type';
import { NodeType } from './node-type';

export interface ShtmlVariable {
    id: string;
    name: string;
    type: string;
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
            type: ShtmlDom.getAttribute(element, 'type') ?? 'any',
            value: ShtmlDom.getJsonContent(element)
        };
        state.variables[variable.id] = variable;
        return variable;
    },
    to(variable: ShtmlVariable): Element {
        const element = document.createElement(NodeType.Variable);
        element.setAttribute('id', variable.id);
        element.setAttribute('name', variable.name);
        element.setAttribute('type', variable.type);
        if (variable.value != null) ShtmlDom.setJsonContent(element, variable.value);
        return element;
    },
    instantiate(variables: ShtmlVariable[]): { locals: Record<string, any>; states: Map<string, State<any>> } {
        const states = new Map(variables.map(variable => [variable.id, new State(variable.value)] as const));
        const locals = variables.reduce((locals, variable) => Object.assign(locals, { [variable.name]: states.get(variable.id).signal.proxy }), {} as Record<string, any>);
        return { locals, states };
    },
    createApi(variables: ShtmlVariable[], states: Map<string, State<any>>, types: ShtmlType[]): Record<string, VariableApi> {
        return variables.reduce((api, variable) => {
            const state = states.get(variable.id)!;
            return Object.assign(api, {
                [variable.name]: {
                    get: () => state.value,
                    set: (update: any) => state.set(update),
                    reset: () => state.set(variable.value),
                    validate: () => $Tson.parse(ShtmlType.resolve(variable.type, types)).parse(state.value)
                } satisfies VariableApi
            });
        }, {} as Record<string, VariableApi>);
    }
};
