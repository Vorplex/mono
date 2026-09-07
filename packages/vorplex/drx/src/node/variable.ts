import { $Id, $Tson, State, type TsonResult } from '@vorplex/core';
import { DrxDocumentState } from '../drx';
import { DrxDom } from '../drx-dom';
import { DrxType } from './type';
import { NodeType } from './node-type';

export interface DrxVariable {
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

export const DrxVariable = {
    from(parent: Element, state: DrxDocumentState): DrxVariable[] {
        const elements = Array.from(parent.querySelectorAll(`:scope > ${NodeType.Variable}`));
        return elements.map(element => DrxVariable.parse(element, state));
    },
    parse(element: Element, state: DrxDocumentState): DrxVariable {
        const variable: DrxVariable = {
            id: DrxDom.getAttribute(element, 'id') ?? $Id.guid(),
            name: DrxDom.getRequiredAttribute(element, 'name'),
            type: DrxDom.getAttribute(element, 'type') ?? 'any',
            value: DrxDom.getJsonContent(element)
        };
        state.variables[variable.id] = variable;
        return variable;
    },
    to(variable: DrxVariable): Element {
        const element = document.createElement(NodeType.Variable);
        element.setAttribute('id', variable.id);
        element.setAttribute('name', variable.name);
        element.setAttribute('type', variable.type);
        if (variable.value != null) DrxDom.setJsonContent(element, variable.value);
        return element;
    },
    instantiate(variables: DrxVariable[]): { locals: Record<string, any>; states: Map<string, State<any>> } {
        const states = new Map(variables.map(variable => [variable.id, new State(variable.value)] as const));
        const locals = variables.reduce((locals, variable) => Object.assign(locals, { [variable.name]: states.get(variable.id).signal.proxy }), {} as Record<string, any>);
        return { locals, states };
    },
    createApi(variables: DrxVariable[], states: Map<string, State<any>>, types: DrxType[]): Record<string, VariableApi> {
        return variables.reduce((api, variable) => {
            const state = states.get(variable.id)!;
            return Object.assign(api, {
                [variable.name]: {
                    get: () => state.value,
                    set: (update: any) => state.set(update),
                    reset: () => state.set(variable.value),
                    validate: () => $Tson.parse(DrxType.resolve(variable.type, types)).parse(state.value)
                } satisfies VariableApi
            });
        }, {} as Record<string, VariableApi>);
    }
};
