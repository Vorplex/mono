import { TsonError, type TsonResult } from '../error';
import type { TsonDefinition } from '../schema';
import { type TsonDefinitionBase, TsonSchemaBase } from './schema-base';

export interface TsonRefDefinition extends TsonDefinitionBase {
    readonly type: 'ref';
    id: string;
}

export class TsonRef extends TsonSchemaBase<any> {

    constructor(public definition: TsonRefDefinition = { type: 'ref', id: null }) {
        super();
    }

    public getDefault(): any {
        throw new Error(`TSON ref with id (${this.definition.id}) must be resolved before it can be used`);
    }

    public accepts(_definition: TsonDefinition | null | undefined): boolean {
        throw new Error(`TSON ref with id (${this.definition.id}) must be resolved before it can be used`);
    }

    public parse(value: any, _failFast = false): TsonResult<any> {
        return [undefined, [new TsonError(`TSON ref with id (${this.definition.id}) must be resolved before it can be parsed`, value, this)]];
    }

}
