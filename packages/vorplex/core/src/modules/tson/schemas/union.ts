import { TsonError } from '../error';
import type { TsonDefinition } from '../schema';
import { $Tson } from '../tson';
import type { TypeTson } from '../type';
import { type TsonDefinitionBase, TsonSchemaBase } from './schema-base';

export interface TsonUnionDefinition<T extends readonly any[] = any> extends TsonDefinitionBase<T> {
    type: 'union';
    default?: undefined;
    union: readonly TypeTson<T>[];
}

export class TsonUnion<T = any> extends TsonSchemaBase<T> {
    constructor(
        public definition: TsonUnionDefinition = {
            type: 'union',
            union: [],
        },
    ) {
        super();
    }

    public default(value: any): TsonUnion {
        return new TsonUnion({
            ...this.definition,
            default: value,
        });
    }

    public getDefault() {
        return this.definition.default;
    }

    public accepts(definition: TsonDefinition | null | undefined): boolean {
        if (definition == null && this.definition.default !== undefined) return true;
        if (definition.type === 'any') return true;
        if (definition.type !== 'union') {
            for (const union of this.definition.union) {
                if ($Tson.parse(union).accepts(definition)) return true;
            }
            return false;
        } else {
            for (const union2 of definition.union) {
                if (!this.definition.union.some((union) => $Tson.parse(union).accepts(union2))) return false;
            }
            return true;
        }
    }

    public parse(value: any) {
        if (this.parseDefault(value)) return this.definition.default;
        for (const type of this.definition.union) {
            try {
                return $Tson.parse(type).parse(value);
            } catch (error) {
                if (!(error instanceof TsonError)) throw error;
            }
        }
        throw new TsonError(`Union type mismatch`, value, this);
    }
}
