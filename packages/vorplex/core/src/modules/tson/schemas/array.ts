import { TsonError } from '../error';
import type { TsonDefinition } from '../schema';
import { $Tson } from '../tson';
import type { TsonType } from '../type';
import { type TsonDefinitionBase, TsonSchemaBase } from './schema-base';

export interface TsonArrayDefinition<T = any> extends TsonDefinitionBase {
    readonly type: 'array';
    min?: number;
    max?: number;
    default?: T[];
    itemDefinition?: TsonDefinition;
}

export class TsonArray<T extends TsonDefinition = any> extends TsonSchemaBase<TsonType<T>[]> {
    constructor(
        public definition: TsonArrayDefinition<TsonType<T>> = {
            type: 'array',
        },
    ) {
        super();
    }

    public default(value: any): TsonArray<T> {
        return new TsonArray<T>({
            ...this.definition,
            default: value,
        });
    }

    public minLength(length: number): TsonArray<T> {
        return new TsonArray<T>({
            ...this.definition,
            min: length,
        });
    }

    public maxLength(length: number): TsonArray<T> {
        return new TsonArray<T>({
            ...this.definition,
            max: length,
        });
    }

    public item(schema: TsonDefinition): TsonArray<T> {
        return new TsonArray<T>({
            ...this.definition,
            itemDefinition: schema,
        });
    }

    public getDefault(): TsonType<T>[] {
        return (this.definition.default ?? this.definition.itemDefinition) ? ([$Tson.parse(this.definition.itemDefinition).getDefault()] as TsonType<T>[]) : [];
    }

    public accepts(definition: TsonDefinition | null | undefined): boolean {
        if (definition == null && this.definition.default !== undefined) return true;
        if (definition.type === 'any') return true;
        if (this.definition.default === undefined && definition.default !== undefined) return false;
        if (definition.type !== 'array') return false;
        if (this.definition.max != null && this.definition.max < definition.max) return false;
        if (this.definition.min != null && this.definition.min < definition.min) return false;
        if (this.definition.itemDefinition != null && !$Tson.parse(this.definition.itemDefinition).accepts(definition.itemDefinition)) return false;
        return true;
    }

    public parse(value: any): TsonType<T>[] {
        if (this.parseDefault(value)) return this.definition.default;
        if (value != null && !Array.isArray(value)) throw new TsonError('Array expected', value, this);
        const array = value as any[];
        if (this.definition.min != null && array.length < this.definition.min) throw new TsonError(`Array min length of ${this.definition.min} expected`, value, this);
        if (this.definition.max != null && array.length > this.definition.max) throw new TsonError(`Array max length of ${this.definition.max} expected`, value, this);
        if (this.definition.itemDefinition) {
            for (const [index, item] of array.entries()) {
                try {
                    array[index] = $Tson.parse(this.definition.itemDefinition).parse(item);
                } catch (error) {
                    if (!(error instanceof TsonError)) throw error;
                    throw new TsonError(`Invalid item in array. ${error.message}`, item, this, `[${index}]${error.path}`);
                }
            }
        }
        return value as TsonType<T>[];
    }
}
