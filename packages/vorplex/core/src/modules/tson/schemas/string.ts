import { TsonError } from '../error';
import type { TsonDefinition } from '../schema';
import { type TsonDefinitionBase, TsonSchemaBase } from './schema-base';

export interface TsonStringDefinition extends TsonDefinitionBase {
    readonly type: 'string';
    default?: string;
    min?: number;
    max?: number;
    match?: string;
}

export class TsonString extends TsonSchemaBase<string> {

    constructor(public definition: TsonStringDefinition = { type: 'string' }) {
        super();
    }

    public match(regex: string): TsonString {
        return new TsonString({
            ...this.definition,
            match: regex,
        });
    }

    public minLength(length: number): TsonString {
        return new TsonString({
            ...this.definition,
            min: length,
        });
    }

    public maxLength(length: number): TsonString {
        return new TsonString({
            ...this.definition,
            max: length,
        });
    }

    public getDefault(): string {
        return this.definition.default ?? '';
    }

    public accepts(definition: TsonDefinition | null | undefined): boolean {
        if (definition == null && this.definition.default !== undefined) return true;
        if (definition.type === 'any') return true;
        if (this.definition.default === undefined && definition.default !== undefined) return false;
        if (definition.type !== 'string') return false;
        if (this.definition.max != null && (definition.max == null || definition.max > this.definition.max)) return false;
        if (this.definition.min != null && (definition.min == null || definition.min < this.definition.min)) return false;
        if (this.definition.match != null && this.definition.match !== definition.match) return false;
        return true;
    }

    public parse(value: any): string {
        if (this.parseDefault(value)) return this.definition.default;
        if (value != null && typeof value !== 'string') throw new TsonError('String expected', value, this);
        if (this.definition.min != null && value.length < this.definition.min) throw new TsonError(`Value min length of ${this.definition.min} expected`, value, this);
        if (this.definition.max != null && value.length > this.definition.max) throw new TsonError(`Value max length of ${this.definition.max} expected`, value, this);
        if (this.definition.match != null && !new RegExp(this.definition.match).exec(value)) throw new TsonError(`Invalid value`, value, this);
        return value;
    }
}
