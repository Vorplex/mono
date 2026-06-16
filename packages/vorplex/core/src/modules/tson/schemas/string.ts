import { TsonError, type TsonResult } from '../error';
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
        return 'default' in this.definition ? this.definition.default : '';
    }

    public accepts(definition: TsonDefinition | null | undefined): boolean {
        if (definition == null) return 'default' in this.definition;
        if (definition.type === 'any') return true;
        if (definition.type !== 'string') return false;
        if (this.definition.max != null && (definition.max == null || definition.max > this.definition.max)) return false;
        if (this.definition.min != null && (definition.min == null || definition.min < this.definition.min)) return false;
        if (this.definition.match != null && this.definition.match !== definition.match) return false;
        return true;
    }

    public parse(value: any, failFast = false): TsonResult<string> {
        const result = this.parseDefault(value);
        if (result) return result;
        const errors: TsonError[] = [];
        if (value != null && typeof value !== 'string') {
            errors.push(new TsonError('String expected', value, this));
            if (failFast) return [undefined, errors];
        }
        if (typeof value === 'string') {
            if (this.definition.min != null && value.length < this.definition.min) {
                errors.push(new TsonError(`Value min length of ${this.definition.min} expected`, value, this));
                if (failFast) return [undefined, errors];
            }
            if (this.definition.max != null && value.length > this.definition.max) {
                errors.push(new TsonError(`Value max length of ${this.definition.max} expected`, value, this));
                if (failFast) return [undefined, errors];
            }
            if (this.definition.match != null && !new RegExp(this.definition.match).exec(value)) {
                errors.push(new TsonError(`Invalid value`, value, this));
                if (failFast) return [undefined, errors];
            }
        }
        return [errors.length === 0 ? value : undefined, errors];
    }
}
