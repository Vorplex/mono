import type { Type } from '../../reflection/types/type.type';
import { $Reflection } from '../../reflection/utils/reflection.util';
import { TsonError } from '../error';
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
        if (this.definition.default !== undefined) return this.definition.default;
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

    public override parse(value: any): { [P in keyof T]: TsonType<T[P]> } {
        if (this.parseDefault(value)) return this.definition.default;
        if (value != null && typeof value !== 'object') throw new TsonError('Object expected', value, this);
        if (this.definition.property) {
            for (const property in value) {
                try {
                    value[property] = $Tson.parse(this.definition.property).parse(value[property]);
                } catch (error) {
                    if (error instanceof TsonError) {
                        error.path = `.${property}${error.path}`;
                    }
                    throw error;
                }
            }
        }
        if (this.definition.properties) {
            for (const property in this.definition.properties) {
                try {
                    value[property] = $Tson.parse(this.definition.properties[property] as TsonDefinition).parse(value[property]);
                } catch (error) {
                    if (error instanceof TsonError) {
                        error.path = `.${property}${error.path}`;
                    }
                    throw error;
                }
            }
        }
        if (this.definition.prototype) value = Object.setPrototypeOf(value, this.definition.prototype);
        return value;
    }
}
