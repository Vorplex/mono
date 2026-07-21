import { $Value } from '../../value/value.util';
import { TsonError, type TsonResult } from '../error';
import type { TsonDefinition } from '../schema';
import { $Tson } from '../tson';
import type { TypeTson } from '../type';
import { type TsonDefinitionBase, TsonSchemaBase } from './schema-base';

export interface TsonRecordDefinition<T = any> extends TsonDefinitionBase<Record<string, T>> {
    readonly type: 'record';
    property?: TypeTson<T>;
}

export class TsonRecord<T = any> extends TsonSchemaBase<Record<string, T>> {

    constructor(public definition: TsonRecordDefinition<T> = { type: 'record' }) {
        super();
    }

    public override accepts(definition: TsonDefinition | null | undefined): boolean {
        if (definition == null) return this.definition.default != null;
        if (definition.type === 'any') return true;
        if (definition.type !== 'record') return false;
        if (!this.definition.property) return true;
        if (!definition.property) return false;
        return $Tson.parse(this.definition.property).accepts(definition.property);
    }

    public override parse(value: any, failFast = false): TsonResult<Record<string, T>> {
        let result: any = this.parseDefault(value);
        if (result) return result;
        const errors: TsonError[] = [];
        if (typeof value !== 'object') {
            return [undefined, [new TsonError('Object expected', value, this)]];
        }
        result = {} as Record<string, any>;
        if (!this.definition.property) return [$Value.clone(value), []];
        for (const property in value) {
            if (failFast && errors.length > 0) break;
            const [propertyValue, propertyErrors] = $Tson.parse(this.definition.property).parse(value[property], failFast);
            result[property] = propertyValue;
            for (const error of propertyErrors) error.path = `.${property}${error.path}`;
            errors.push(...propertyErrors);
        }
        return [errors.length === 0 ? result : undefined, errors];
    }
}
