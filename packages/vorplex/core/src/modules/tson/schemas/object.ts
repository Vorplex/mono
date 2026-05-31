import type { Type } from '../../reflection/types/type.type';
import { $Reflection } from '../../reflection/utils/reflection.util';
import { TsonError, type TsonResult } from '../error';
import type { TsonDefinition } from '../schema';
import { $Tson } from '../tson';
import type { TsonType, TypeTson } from '../type';
import { type TsonDefinitionBase, TsonSchemaBase } from './schema-base';

export interface TsonObjectDefinition<T extends Record<string, any> = Record<string, any>> extends TsonDefinitionBase {
    readonly type: 'object';
    property?: TsonDefinition;
    properties?: { [key in keyof T]: TypeTson<T[key]> };
    prototype?: any;
    default?: T;
}

export class TsonObject<T extends { [key: string]: TsonDefinition } = {}> extends TsonSchemaBase<{
    [P in keyof T]: TsonType<T[P]>;
}> {
    constructor(public definition: TsonObjectDefinition<{ [P in keyof T]: TsonType<T[P]> }> = { type: 'object' }) {
        super();
    }

    public override getDefault(): { [P in keyof T]: TsonType<T[P]> } {
        if ('default' in this.definition) return this.definition.default;
        if (this.definition.property) return {} as { [P in keyof T]: TsonType<T[P]> };
        if (!this.definition.properties) return {} as { [P in keyof T]: TsonType<T[P]> };
        const result: Record<string, any> = {};
        for (const property in this.definition.properties) {
            result[property] = $Tson.parse(this.definition.properties[property] as TsonDefinition).getDefault();
        }
        return result as { [P in keyof T]: TsonType<T[P]> };
    }

    public prototype(type: Type): TsonObject<T> {
        this.definition.prototype = type.prototype;
        return this;
    }

    public override accepts(definition: TsonDefinition | null | undefined): boolean {
        if (definition == null && this.definition.default !== undefined) return true;
        if (definition.type === 'any') return true;
        if (this.definition.default === undefined && definition.default !== undefined) return false;
        if (definition.type !== 'object') return false;
        if (this.definition.prototype != null && !$Reflection.extends(definition.prototype, this.definition.prototype)) return false;
        if (this.definition.property) {
            if (!definition.property) return false;
            if (!$Tson.parse(this.definition.property).accepts(definition.property)) return false;
        }
        if (this.definition.properties) {
            for (const property in this.definition.properties) {
                if (!$Tson.parse(this.definition.properties[property] as TsonDefinition).accepts(definition.properties?.[property])) return false;
            }
        }
        return true;
    }

    public override parse(value: any, failFast = false): TsonResult<{ [P in keyof T]: TsonType<T[P]> }> {
        let result: any = this.parseDefault(value);
        if (result) return result;
        const errors: TsonError[] = [];
        if (value != null && typeof value !== 'object') {
            return [undefined, [new TsonError('Object expected', value, this)]];
        }
        result = {} as Record<string, any>;
        if (this.definition.property) {
            for (const property in value) {
                if (failFast && errors.length > 0) break;
                const [childValue, childErrors] = $Tson.parse(this.definition.property).parse(value[property], failFast);
                result[property] = childValue;
                for (const error of childErrors) error.path = `.${property}${error.path}`;
                errors.push(...childErrors);
            }
        }
        if (this.definition.properties) {
            for (const property in this.definition.properties) {
                if (failFast && errors.length > 0) break;
                const [childValue, childErrors] = $Tson.parse(this.definition.properties[property] as TsonDefinition).parse(value[property], failFast);
                result[property] = childValue;
                for (const error of childErrors) error.path = `.${property}${error.path}`;
                errors.push(...childErrors);
            }
        }
        if (this.definition.prototype) Object.setPrototypeOf(result, this.definition.prototype);
        return [errors.length === 0 ? result as { [P in keyof T]: TsonType<T[P]> } : undefined, errors];
    }
}
