import { TsonError, type TsonResult } from '../error';
import type { TsonDefinition } from '../schema';
import { $Tson } from '../tson';
import { TsonType } from '../type';
import { type TsonDefinitionBase, TsonSchemaBase } from './schema-base';

export interface TsonArrayDefinition<T = any> extends TsonDefinitionBase {
    readonly type: 'array';
    min?: number;
    max?: number;
    default?: { value: T[] };
    itemDefinition?: TsonDefinition;
    readonly?: true;
}

export class TsonArray<T extends TsonDefinition = any> extends TsonSchemaBase<TsonType<T>[]> {
    constructor(
        public definition: TsonArrayDefinition<TsonType<T>> = {
            type: 'array',
        },
    ) {
        super();
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

    public accepts(definition: TsonDefinition | null | undefined): boolean {
        if (definition == null) return this.definition.default != null;
        if (definition.type === 'any') return true;
        if (definition.type !== 'array') return false;
        if (this.definition.max != null && this.definition.max < definition.max) return false;
        if (this.definition.min != null && this.definition.min < definition.min) return false;
        if (this.definition.itemDefinition != null && !$Tson.parse(this.definition.itemDefinition).accepts(definition.itemDefinition)) return false;
        return true;
    }

    public parse(value: any, failFast = false): TsonResult<TsonType<T>[]> {
        let result: any = this.parseDefault(value);
        if (result) return result;
        const errors: TsonError[] = [];
        if (!Array.isArray(value)) {
            return [undefined, [new TsonError('Array expected', value, this)]];
        }
        if (this.definition.min != null && value.length < this.definition.min) {
            errors.push(new TsonError(`Array min length of ${this.definition.min} expected`, value, this));
            if (failFast) return [undefined, errors];
        }
        if (this.definition.max != null && value.length > this.definition.max) {
            errors.push(new TsonError(`Array max length of ${this.definition.max} expected`, value, this));
            if (failFast) return [undefined, errors];
        }
        if (!this.definition.itemDefinition) return [[...value], errors];
        result = [] as TsonType<T>[];
        for (const [index, item] of value.entries()) {
            if (failFast && errors.length > 0) break;
            const [childValue, childErrors] = $Tson.parse(this.definition.itemDefinition).parse(item, failFast);
            result[index] = childValue;
            for (const error of childErrors) error.path = `[${index}]${error.path}`;
            errors.push(...childErrors);
        }
        return [errors.length === 0 ? result as TsonType<T>[] : undefined, errors];
    }
}
