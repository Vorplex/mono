import type { Type } from '../../reflection/types/type.type';
import { $Reflection } from '../../reflection/utils/reflection.util';
import { TsonError, type TsonResult } from '../error';
import type { TsonDefinition } from '../schema';
import { $Tson } from '../tson';
import type { TypeTson } from '../type';
import { type TsonDefinitionBase, TsonSchemaBase } from './schema-base';

export interface TsonObjectDefinition<T extends Record<string, any> = Record<string, any>> extends TsonDefinitionBase<T> {
    readonly type: 'object';
    properties?: { [key in keyof T]: TypeTson<T[key]> };
    prototype?: any;
}

export class TsonObject<T extends Record<string, any> = Record<string, any>> extends TsonSchemaBase<T> {
    constructor(public definition: TsonObjectDefinition<T> = { type: 'object' }) {
        super();
    }

    public prototype(type: Type): TsonObject<T> {
        this.definition.prototype = type.prototype;
        return this;
    }

    public override accepts(definition: TsonDefinition | null | undefined): boolean {
        if (definition == null) return this.definition.default != null;
        if (definition.type === 'any') return true;
        if (definition.type !== 'object') return false;
        if (this.definition.prototype != null && !$Reflection.extends(definition.prototype, this.definition.prototype)) return false;
        for (const property in this.definition.properties ?? {}) {
            if (!$Tson.parse(this.definition.properties[property]).accepts(definition.properties?.[property])) return false;
        }
        return true;
    }

    public override parse(value: any, failFast = false): TsonResult<T> {
        let result: any = this.parseDefault(value);
        if (result) return result;
        const errors: TsonError[] = [];
        if (typeof value !== 'object') {
            return [undefined, [new TsonError('Object expected', value, this)]];
        }
        result = {} as Partial<T>;
        for (const property in this.definition.properties) {
            if (failFast && errors.length > 0) break;
            const [propertyValue, propertyErrors] = $Tson.parse(this.definition.properties[property]).parse(value[property], failFast);
            result[property] = propertyValue;
            for (const error of propertyErrors) error.path = `.${property}${error.path}`;
            errors.push(...propertyErrors);
        }
        if (this.definition.prototype) Object.setPrototypeOf(result, this.definition.prototype);
        return [errors.length === 0 ? result as T : undefined, errors];
    }
}
