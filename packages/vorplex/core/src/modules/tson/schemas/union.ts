import { TsonError, type TsonResult } from '../error';
import type { TsonDefinition } from '../schema';
import { $Tson } from '../tson';
import type { TypeTson } from '../type';
import { type TsonDefinitionBase, TsonSchemaBase } from './schema-base';

export interface TsonUnionDefinition<T extends readonly any[] = any> extends TsonDefinitionBase<T> {
    type: 'union';
    default?: { value: any };
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

    public accepts(definition: TsonDefinition | null | undefined): boolean {
        if (definition == null) return this.definition.default != null;
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

    public parse(value: any, failFast = false): TsonResult<T> {
        const result = this.parseDefault(value);
        if (result) return result;
        for (const type of this.definition.union) {
            const [result, errors] = $Tson.parse(type).parse(value, true);
            if (errors.length === 0) return [result as T, []];
        }
        return [undefined, [new TsonError(`Union type mismatch`, value, this)]];
    }
}
