import { TsonError, type TsonResult } from '../error';
import type { TsonDefinition } from '../schema';
import { type TsonDefinitionBase, TsonSchemaBase } from './schema-base';

export interface TsonEnumDefinition<T extends string | number = any> extends TsonDefinitionBase {
    readonly type: 'enum';
    default?: { value: T };
    flags: T[];
}

export class TsonEnum<T extends string | number = any> extends TsonSchemaBase<T> {
    constructor(
        public definition: TsonEnumDefinition<T> = {
            type: 'enum',
            flags: [],
        },
    ) {
        super();
    }

    public accepts(definition: TsonDefinition | null | undefined): boolean {
        if (definition == null) return this.definition.default != null;
        if (definition.type === 'any') return true;
        if (definition.type !== 'enum') return false;
        return this.definition.flags.every((flag) => definition.flags.includes(flag as T));
    }

    public parse(value: any, failFast = false): TsonResult<T> {
        const result = this.parseDefault(value);
        if (result) return result;
        const errors: TsonError[] = [];
        if (typeof this.definition.flags[0] === 'string' && typeof value !== 'string') {
            errors.push(new TsonError('String expected', value, this));
            if (failFast) return [undefined, errors];
        }
        if (typeof this.definition.flags[0] === 'number' && typeof value !== 'number') {
            errors.push(new TsonError('Number expected', value, this));
            if (failFast) return [undefined, errors];
        }
        if (!this.definition.flags.includes(value as T)) {
            errors.push(new TsonError(`Enum value expected (${this.definition.flags.join(', ')})`, value, this));
            if (failFast) return [undefined, errors];
        }
        return [errors.length === 0 ? value as T : undefined, errors];
    }
}
