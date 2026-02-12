import { TsonError } from '../error';
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
        return this.definition.default ?? 0;
    }

    public accepts(definition: TsonDefinition | null | undefined): boolean {
        if (definition == null && this.definition.default !== undefined) return true;
        if (definition.type === 'any') return true;
        if (this.definition.default === undefined && definition.default !== undefined) return false;
        if (definition.type !== 'number') return false;
        if (this.definition.min != null && (definition.min == null || definition.min < this.definition.min)) return false;
        if (this.definition.max != null && (definition.max == null || definition.max > this.definition.max)) return false;
        if (this.definition.integer != null && this.definition.integer !== definition.integer) return false;
        return true;
    }

    public parse(value: any): number {
        if (this.parseDefault(value)) return this.definition.default;
        if (value != null && typeof value !== 'number') throw new TsonError('Number expected', value, this);
        if (this.definition.min != null && value < this.definition.min) throw new TsonError(`Number should be greater than ${this.definition.min}`, value, this);
        if (this.definition.max != null && value > this.definition.max) throw new TsonError(`Number should be less than ${this.definition.max}`, value, this);
        return value;
    }
}
