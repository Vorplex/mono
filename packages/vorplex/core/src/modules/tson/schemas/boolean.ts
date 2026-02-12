import { TsonError } from '../error';
import type { TsonDefinition } from '../schema';
import { type TsonDefinitionBase, TsonSchemaBase } from './schema-base';

export interface TsonBooleanDefinition extends TsonDefinitionBase {
    readonly type: 'boolean';
    default?: boolean;
}

export class TsonBoolean extends TsonSchemaBase<boolean> {
    constructor(
        public definition: TsonBooleanDefinition = {
            type: 'boolean',
        },
    ) {
        super();
    }

    public default(value: any): TsonBoolean {
        return new TsonBoolean({
            ...this.definition,
            default: value,
        });
    }

    public getDefault(): boolean {
        return this.definition.default ?? false;
    }

    public accepts(definition: TsonDefinition | null | undefined): boolean {
        if (definition == null) return this.definition.default !== undefined;
        if (definition.type === 'any') return true;
        if (definition.type !== 'boolean') return false;
        if (this.definition.default === undefined && definition.default !== undefined) return false;
        return true;
    }

    public parse(value: any): boolean {
        if (this.parseDefault(value)) return this.definition.default;
        if (value != null && typeof value !== 'boolean') throw new TsonError('Boolean expected', value, this);
        return value;
    }
}
