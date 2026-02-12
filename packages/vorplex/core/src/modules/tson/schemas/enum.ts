import { TsonError } from '../error';
import type { TsonDefinition } from '../schema';
import { type TsonDefinitionBase, TsonSchemaBase } from './schema-base';

export interface TsonEnumDefinition<T extends string | number = any> extends TsonDefinitionBase {
    readonly type: 'enum';
    default?: T;
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

    public default(value: any): TsonEnum {
        return new TsonEnum({
            ...this.definition,
            default: value,
        });
    }

    public getDefault(): T {
        return this.definition.default ?? this.definition.flags[0];
    }

    public accepts(definition: TsonDefinition | null | undefined): boolean {
        if (definition.type === 'any') return true;
        if (definition == null && this.definition.default !== undefined) return true;
        if (this.definition.default === undefined && definition.default !== undefined) return false;
        if (definition.type !== 'enum') return false;
        return this.definition.flags.every((flag) => definition.flags.includes(flag as T));
    }

    public parse(value: any): T {
        if (this.parseDefault(value)) return this.definition.default;
        if (value != null && typeof this.definition.flags[0] === 'string' && typeof value !== 'string') throw new TsonError('String expected', value, this);
        if (value != null && typeof this.definition.flags[0] === 'number' && typeof value !== 'number') throw new TsonError('Number expected', value, this);
        if (!this.definition.flags.includes(value as T)) throw new TsonError('Invalid value', value, this);
        return value as T;
    }
}
