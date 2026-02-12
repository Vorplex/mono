import { $Enum } from '../enum/enum.util';
import { $Reflection } from '../reflection/utils/reflection.util';
import { $String } from '../string/string.util';
import type { TsonDefinition, TsonSchema } from './schema';
import { TsonAny, type TsonAnyDefinition } from './schemas/any';
import { TsonArray, type TsonArrayDefinition } from './schemas/array';
import { TsonBoolean, type TsonBooleanDefinition } from './schemas/boolean';
import { TsonEnum, type TsonEnumDefinition } from './schemas/enum';
import { TsonNumber, type TsonNumberDefinition } from './schemas/number';
import { TsonObject, type TsonObjectDefinition } from './schemas/object';
import { TsonString, type TsonStringDefinition } from './schemas/string';
import { TsonUnion, type TsonUnionDefinition } from './schemas/union';

export class $Tson {

    public static string<T extends Omit<TsonStringDefinition, 'type'>>(definition?: T): T & Pick<TsonStringDefinition, 'type'> {
        return { type: 'string', ...(definition ?? {}) } as T & Pick<TsonStringDefinition, 'type'>;
    }

    public static number<T extends Omit<TsonNumberDefinition, 'type'>>(definition?: T): T & Pick<TsonNumberDefinition, 'type'> {
        return { type: 'number', ...(definition ?? {}) } as T & Pick<TsonNumberDefinition, 'type'>;
    }

    public static boolean<T extends Omit<TsonBooleanDefinition, 'type'>>(definition?: T): T & Pick<TsonBooleanDefinition, 'type'> {
        return { type: 'boolean', ...(definition ?? {}) } as T & Pick<TsonBooleanDefinition, 'type'>;
    }

    public static array<T extends Omit<TsonArrayDefinition, 'type'>>(definition?: T): T & Pick<TsonArrayDefinition, 'type'> {
        return { type: 'array', ...(definition ?? {}) } as T & Pick<TsonArrayDefinition, 'type'>;
    }

    public static object<P extends Record<string, TsonDefinition>>(definition: { properties: P } & Omit<TsonObjectDefinition<P>, 'type' | 'properties'>): { readonly type: 'object', properties: P };
    public static object<P extends TsonDefinition>(definition: { property: P } & Omit<TsonObjectDefinition<P>, 'type' | 'property'>): { readonly type: 'object', property: P };
    public static object<T>(definition?: Omit<TsonObjectDefinition<T>, 'type'>): TsonObjectDefinition<T>;
    public static object(definition?: any): any {
        return { type: 'object', ...(definition ?? {}) };
    }

    public static any(definition?: Omit<TsonAnyDefinition, 'type'>): TsonAnyDefinition {
        return { type: 'any', ...(definition ?? {}) };
    }

    public static enum<T extends string | number = any>(definition?: Omit<TsonEnumDefinition<T>, 'type'>): TsonEnumDefinition<T> {
        return { type: 'enum', flags: [], ...(definition ?? {}) } as TsonEnumDefinition<T>;
    }

    public static const<T extends string | number>(...flags: T[]): TsonEnumDefinition<T> {
        return {
            type: 'enum',
            flags
        };
    }

    public static union<T extends readonly TsonDefinition[]>(definition: { union: T } & Omit<TsonUnionDefinition<T>, 'union' | 'type'>): { type: 'union', union: T } {
        return {
            type: 'union',
            union: [],
            ...(definition ?? {}),
        } as { type: 'union', union: T };
    }

    public static fromEnum<T extends object>(flags: T): TsonEnumDefinition<T[keyof T] extends string ? T[keyof T] & string : T[keyof T] & number> {
        return {
            type: 'enum',
            flags: $Enum.getValues(flags),
        };
    }

    public static parse(definition: TsonDefinition): TsonSchema {
        switch (definition.type) {
            case 'any':
                return new TsonAny(definition);
            case 'string':
                return new TsonString(definition);
            case 'number':
                return new TsonNumber(definition);
            case 'boolean':
                return new TsonBoolean(definition);
            case 'object':
                return new TsonObject(definition);
            case 'array':
                return new TsonArray(definition);
            case 'enum':
                return new TsonEnum(definition);
            case 'union':
                return new TsonUnion(definition);
        }
    }

    public static generateTypeScriptDefinition(definition: TsonDefinition): string {
        if (definition == null) return 'any';
        switch (definition.type) {
            case 'any':
                return 'any';
            case 'string':
                return 'string';
            case 'number':
                return 'number';
            case 'boolean':
                return 'boolean';
            case 'object':
                if (definition.property) {
                    let result = '';
                    if (definition.description) result += `// ${definition.property.description}\n`;
                    result += `[key: string]: ${this.generateTypeScriptDefinition(definition.property)}`;
                    return `{\n${$String.indent(result, 4)}\n}`;
                } else if (definition.properties) {
                    const result = Object
                        .entries(definition.properties)
                        .map(([property, value]) => {
                            let result = '';
                            if (value.description) result += `// ${value.description}\n`;
                            result += `'${property}'${'default' in value ? '?' : ''}: ${this.generateTypeScriptDefinition(value)}`;
                            return result;
                        })
                        .join(',\n');
                    return `{\n${$String.indent(result, 4)}\n}`;
                } else return 'Record<string, any>';
            case 'array':
                return `${this.generateTypeScriptDefinition(definition.itemDefinition)}[]`
            case 'enum':
                return `${definition.flags.map(flag => typeof flag === 'string' ? `'${flag}'` : flag).join(' | ')}`;
            case 'union':
                return `${definition.union.map(definition => this.generateTypeScriptDefinition(definition)).join(' | ')}`;
        }
    }

    public static generate(value: any): TsonDefinition {
        if (typeof value === 'string') return $Tson.string();
        if (typeof value === 'number') return $Tson.number();
        if (typeof value === 'boolean') return $Tson.boolean();
        if ($Enum.isEnum(value)) return $Tson.enum(value);
        if ($Reflection.isArray(value))
            return $Tson.array({
                itemDefinition: $Tson.generate(value[0]) ?? $Tson.any(),
            });
        if ($Reflection.isObject(value))
            return $Tson.object({
                properties: Object.keys(value).reduce(
                    (properties, key) => ({
                        ...properties,
                        [key]: $Tson.generate(value[key]),
                    }),
                    {},
                ),
            });
        return $Tson.any();
    }
}
