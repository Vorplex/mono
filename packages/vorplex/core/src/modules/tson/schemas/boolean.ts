import { TsonError, type TsonResult } from '../error';
import type { TsonDefinition } from '../schema';
import { type TsonDefinitionBase, TsonSchemaBase } from './schema-base';

export interface TsonBooleanDefinition extends TsonDefinitionBase {
    readonly type: 'boolean';
    default?: { value: boolean };
}

export class TsonBoolean extends TsonSchemaBase<boolean> {
    constructor(
        public definition: TsonBooleanDefinition = {
            type: 'boolean',
        },
    ) {
        super();
    }

    public accepts(definition: TsonDefinition | null | undefined): boolean {
        if (definition == null) return this.definition.default != null;
        if (definition.type === 'any') return true;
        if (definition.type !== 'boolean') return false;
        return true;
    }

    public parse(value: any, failFast = false): TsonResult<boolean> {
        const result = this.parseDefault(value);
        if (result) return result;
        const errors: TsonError[] = [];
        if (typeof value !== 'boolean') {
            errors.push(new TsonError('Boolean expected', value, this));
            if (failFast) return [undefined, errors];
        }
        return [errors.length === 0 ? value : undefined, errors];
    }
}
