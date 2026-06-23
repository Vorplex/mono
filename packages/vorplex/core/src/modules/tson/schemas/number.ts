import { TsonError, type TsonResult } from '../error';
import type { TsonDefinition } from '../schema';
import { type TsonDefinitionBase, TsonSchemaBase } from './schema-base';

export interface TsonNumberDefinition extends TsonDefinitionBase {
    readonly type: 'number';
    min?: number;
    max?: number;
    default?: number;
    integer?: boolean;
}

export class TsonNumber extends TsonSchemaBase<number> {
    constructor(
        public definition: TsonNumberDefinition = {
            type: 'number',
        },
    ) {
        super();
    }

    public default(value: any): TsonNumber {
        return new TsonNumber({
            ...this.definition,
            default: value,
        });
    }

    public isInteger(): TsonNumber {
        return new TsonNumber({
            ...this.definition,
            integer: true,
        });
    }

    public min(value: number): TsonNumber {
        return new TsonNumber({
            ...this.definition,
            min: value,
        });
    }

    public max(value: number): TsonNumber {
        return new TsonNumber({
            ...this.definition,
            max: value,
        });
    }

    public getDefault(): number {
        return 'default' in this.definition ? this.definition.default : 0;
    }

    public accepts(definition: TsonDefinition | null | undefined): boolean {
        if (definition == null) return 'default' in this.definition;
        if (definition.type === 'any') return true;
        if (definition.type !== 'number') return false;
        if (this.definition.min != null && (definition.min == null || definition.min < this.definition.min)) return false;
        if (this.definition.max != null && (definition.max == null || definition.max > this.definition.max)) return false;
        if (this.definition.integer != null && this.definition.integer !== definition.integer) return false;
        return true;
    }

    public parse(value: any, failFast = false): TsonResult<number> {
        const result = this.parseDefault(value);
        if (result) return result;
        const errors: TsonError[] = [];
        if (typeof value !== 'number') {
            errors.push(new TsonError('Number expected', value, this));
            if (failFast) return [undefined, errors];
        }
        if (typeof value === 'number') {
            if (this.definition.min != null && value < this.definition.min) {
                errors.push(new TsonError(`Number should be greater than ${this.definition.min}`, value, this));
                if (failFast) return [undefined, errors];
            }
            if (this.definition.max != null && value > this.definition.max) {
                errors.push(new TsonError(`Number should be less than ${this.definition.max}`, value, this));
                if (failFast) return [undefined, errors];
            }
        }
        return [errors.length === 0 ? value : undefined, errors];
    }
}
