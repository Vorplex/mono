import type { TsonResult } from '../error';
import type { TsonDefinition } from '../schema';
import { type TsonDefinitionBase, TsonSchemaBase } from './schema-base';

export interface TsonAnyDefinition extends TsonDefinitionBase {
    type: 'any';
    default?: { value: any };
}

export class TsonAny extends TsonSchemaBase<any> {
    constructor(
        public definition: TsonAnyDefinition = {
            type: 'any',
        },
    ) {
        super();
    }

    public accepts(definition: TsonDefinition | null | undefined): boolean {
        if (definition == null) return this.definition.default != null;
        return true;
    }

    public parse(value: any, failFast = false): TsonResult<any> {
        const result = this.parseDefault(value);
        if (result) return result;
        return [value, []];
    }
}
