import { Extended } from '../../types/extended.type';
import { $Enum } from '../enum/enum.util';
import { $PathSelector, SelectorPath } from '../path-selector/path-selector.util';
import { $Reflection } from '../reflection/utils/reflection.util';
import { $String } from '../string/string.util';
import type { TsonDefinition, TsonSchema } from './schema';
import { TsonAny, type TsonAnyDefinition } from './schemas/any';
import { TsonArray, type TsonArrayDefinition } from './schemas/array';
import { TsonBoolean, type TsonBooleanDefinition } from './schemas/boolean';
import { TsonEnum, type TsonEnumDefinition } from './schemas/enum';
import { TsonNumber, type TsonNumberDefinition } from './schemas/number';
import { TsonObject, type TsonObjectDefinition } from './schemas/object';
import { TsonRecord, type TsonRecordDefinition } from './schemas/record';
import { TsonRef, type TsonRefDefinition } from './schemas/ref';
import { TsonString, type TsonStringDefinition } from './schemas/string';
import { TsonUnion, type TsonUnionDefinition } from './schemas/union';

type ExtendedObjectDefinition<T extends TsonObjectDefinition, TT extends TsonObjectDefinition> = Extended<Extended<T, TT>, { properties: Extended<NonNullable<T['properties']>, NonNullable<TT['properties']>> }>;

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

    public static extends<T extends TsonObjectDefinition, TT extends TsonObjectDefinition>(base: T, definition: TT): ExtendedObjectDefinition<T, TT> {
        return {
            ...base,
            ...definition,
            properties: {
                ...base.properties,
                ...definition.properties
            }
        } as ExtendedObjectDefinition<T, TT>;
    }

    public static object<T extends Omit<TsonObjectDefinition, 'type'>>(definition?: T): T & Pick<TsonObjectDefinition, 'type'> {
        return { type: 'object', ...(definition ?? {}) } as T & Pick<TsonObjectDefinition, 'type'>;
    }

    public static record<T extends Omit<TsonRecordDefinition, 'type'>>(definition?: T): T & Pick<TsonRecordDefinition, 'type'> {
        return { type: 'record', ...(definition ?? {}) } as T & Pick<TsonRecordDefinition, 'type'>;
    }

    public static any<T extends Omit<TsonAnyDefinition, 'type'>>(definition?: T): T & Pick<TsonAnyDefinition, 'type'> {
        return { type: 'any', ...(definition ?? {}) } as T & Pick<TsonAnyDefinition, 'type'>;
    }

    public static ref<T extends Omit<TsonRefDefinition, 'type'>>(definition: T): T & Pick<TsonRefDefinition, 'type'> {
        return { type: 'ref', ...definition } as T & Pick<TsonRefDefinition, 'type'>;
    }

    public static enum<T extends Omit<TsonEnumDefinition, 'type'> = { flags: any[] }>(definition?: T): T & Pick<TsonEnumDefinition, 'type'> {
        return { type: 'enum', flags: [], ...(definition ?? {}) } as T & Pick<TsonEnumDefinition, 'type'>;
    }

    public static const<T extends string | number>(...flags: T[]): TsonEnumDefinition<T> {
        return {
            type: 'enum',
            flags
        };
    }

    public static union<T extends { union: readonly TsonDefinition[] } & Omit<TsonUnionDefinition, 'union' | 'type'>>(definition: T): T & Pick<TsonUnionDefinition, 'type'> {
        return {
            type: 'union',
            union: [],
            ...(definition ?? {}),
        } as T & Pick<TsonUnionDefinition, 'type'>;
    }

    public static fromEnum<T extends object>(flags: T): TsonEnumDefinition<T[keyof T] extends string ? T[keyof T] & string : T[keyof T] & number> {
        return {
            type: 'enum',
            flags: $Enum.getValues(flags),
        };
    }

    public static getDefaultDefinition(type: TsonDefinition['type']): TsonDefinition {
        switch (type) {
            case 'any':
                return new TsonAny().definition;
            case 'string':
                return new TsonString().definition;
            case 'number':
                return new TsonNumber().definition;
            case 'boolean':
                return new TsonBoolean().definition;
            case 'object':
                return new TsonObject().definition;
            case 'record':
                return new TsonRecord().definition;
            case 'array':
                return new TsonArray().definition;
            case 'enum':
                return new TsonEnum().definition;
            case 'union':
                return new TsonUnion().definition;
            case 'ref':
                return new TsonRef().definition;
        }
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
            case 'record':
                return new TsonRecord(definition);
            case 'array':
                return new TsonArray(definition);
            case 'enum':
                return new TsonEnum(definition);
            case 'union':
                return new TsonUnion(definition);
            case 'ref':
                return new TsonRef(definition);
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
            case 'object': {
                if (!definition.properties) return 'Record<string, any>';
                const result = Object
                    .entries(definition.properties)
                    .map(([property, value]) => {
                        let result = '';
                        if (value.description) result += `// ${value.description}\n`;
                        result += `'${property}'${value.default ? '?' : ''}: ${this.generateTypeScriptDefinition(value)}`;
                        return result;
                    })
                    .join(',\n');
                return `{\n${$String.indent(result, 4)}\n}`;
            }
            case 'record': {
                let result = '';
                if (definition.description) result += `// ${definition.description}\n`;
                result += `[key: string]: ${this.generateTypeScriptDefinition(definition.property)}`;
                return `{\n${$String.indent(result, 4)}\n}`;
            }
            case 'array':
                return `${this.generateTypeScriptDefinition(definition.itemDefinition)}[]`
            case 'enum':
                return `${definition.flags.map(flag => typeof flag === 'string' ? `'${flag}'` : flag).join(' | ')}`;
            case 'union':
                return `${definition.union.map(definition => this.generateTypeScriptDefinition(definition)).join(' | ')}`;
            case 'ref':
                throw new Error(`Cannot generate a TypeScript definition for an unresolved TSON ref with id (${definition.id})`);
        }
    }

    public static generateJsonSchema(definition: TsonDefinition): object {
        const buildDefs = (definition: TsonDefinition, $defs = new Map<TsonDefinition, { name: string, schema: { $ref: string } }>(), seen = new Set<TsonDefinition>()) => {
            if (definition == null) return $defs;
            if ($defs.has(definition)) return $defs;
            if (seen.has(definition)) {
                const name = `def${$defs.size}`;
                $defs.set(definition, { name, schema: { $ref: `#/$defs/${name}` } });
                return $defs;
            }
            seen.add(definition);
            if (definition.type === 'object') {
                for (const property of Object.values(definition.properties ?? {})) {
                    buildDefs(property, $defs, seen);
                }
            }
            else if (definition.type === 'record') buildDefs(definition.property, $defs, seen);
            else if (definition.type === 'array') buildDefs(definition.itemDefinition, $defs, seen);
            else if (definition.type === 'union') {
                for (const item of definition.union) {
                    buildDefs(item, $defs, seen);
                }
            }
            return $defs;
        };
        const $defs = buildDefs(definition);

        const build = (definition: TsonDefinition, $defs: Map<TsonDefinition, { name: string, schema: { $ref: string } }>, inline?: boolean): object => {
            if (definition == null) return {};
            if (!inline && $defs.has(definition)) return $defs.get(definition).schema;
            const meta = (schema: any) => {
                if (definition.description) schema.description = definition.description;
                if (definition.default) schema.default = definition.default.value;
                return schema;
            };
            switch (definition.type) {
                case 'any': return {};
                case 'string': return meta({
                    type: 'string',
                    ...(definition.min != null && { minLength: definition.min }),
                    ...(definition.max != null && { maxLength: definition.max }),
                    ...(definition.match != null && { pattern: definition.match }),
                });
                case 'number': return meta({
                    type: definition.integer ? 'integer' : 'number',
                    ...(definition.min != null && { minimum: definition.min }),
                    ...(definition.max != null && { maximum: definition.max }),
                });
                case 'boolean': return meta({ type: 'boolean' });
                case 'object': {
                    const required: string[] = [];
                    const properties: Record<string, any> = {};
                    for (const [property, value] of Object.entries(definition.properties ?? {})) {
                        properties[property] = [property, build(value, $defs)];
                        if (!value.default) required.push(property);
                    }
                    return meta({
                        type: 'object',
                        ...(Object.keys(properties).length > 0 && { properties }),
                        ...(required.length > 0 && { required })
                    });
                }
                case 'record': return meta({
                    type: 'object',
                    additionalProperties: build(definition.property, $defs)
                });
                case 'array': return meta({
                    type: 'array',
                    items: build(definition.itemDefinition, $defs),
                    ...(definition.min != null && { minItems: definition.min }),
                    ...(definition.max != null && { maxItems: definition.max }),
                });
                case 'enum': return meta({ enum: definition.flags });
                case 'union': return meta({ oneOf: definition.union.map(item => build(item, $defs)) });
                case 'ref':
                    throw new Error(`Cannot generate a JSON Schema for an unresolved TSON ref with id (${definition.id})`);
            }
        };

        return {
            ...($defs.size ? { $defs: Array.from($defs.entries()).reduce((defs, [def, ref]) => ({ ...defs, [ref.name]: build(def, $defs, true) }), {}) } : {}),
            ...build(definition, $defs)
        };
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
    public static getPaths(definition: TsonObjectDefinition): string[][] {
        const paths: string[][] = [];
        function traverse(definition: TsonDefinition, path: string[]) {
            if (definition?.type !== 'object' || !definition.properties || Object.keys(definition.properties).length === 0) {
                if (path.length) paths.push(path);
                return;
            }
            for (const key of Object.keys(definition.properties)) {
                traverse(definition.properties[key], [...path, key]);
            }
        }
        traverse(definition, []);
        return paths;
    }

    public static getDefinitionAtPath(definition: TsonDefinition, path: SelectorPath): TsonDefinition | undefined {
        const resolve = (definition: TsonDefinition, segments: string[]): TsonDefinition | undefined => {
            if (definition == null) return undefined;
            if (segments.length === 0) return definition;
            const [key, ...rest] = segments;
            switch (definition.type) {
                case 'any': return definition;
                case 'array': return definition.itemDefinition ? resolve(definition.itemDefinition, rest) : undefined;
                case 'object': return definition.properties?.[key] ? resolve(definition.properties[key], rest) : undefined;
                case 'record': return definition.property ? resolve(definition.property, rest) : undefined;
                case 'union': {
                    const results = definition.union
                        .map(item => resolve(item, segments))
                        .filter(item => item != null);
                    if (results.length === 0) return undefined;
                    return results.length === 1 ? results[0] : this.union({ union: results as TsonDefinition[] });
                }
                case 'ref': throw new Error(`Cannot resolve a path through an unresolved TSON ref with id (${definition.id})`);
                default: return undefined;
            }
        };
        return resolve(definition, $PathSelector.parse(path));
    }

    public static resolveRefs(definition: TsonDefinition, resolve: (id: string) => TsonDefinition | undefined): TsonDefinition {
        const resolveRefs = (definition: TsonDefinition, seen: ReadonlySet<string>): TsonDefinition => {
            if (definition == null) return definition;
            if (definition.type === 'ref') {
                if (seen.has(definition.id)) throw new Error(`Circular TSON ref detected with id (${definition.id})`);
                const resolved = resolve(definition.id);
                if (resolved == null) throw new Error(`Unable to resolve TSON ref with id (${definition.id})`);
                return resolveRefs(resolved, new Set(seen).add(definition.id));
            }
            switch (definition.type) {
                case 'object':
                    if (!definition.properties) return definition;
                    return {
                        ...definition,
                        properties: Object.fromEntries(Object.entries(definition.properties).map(([key, value]) => [key, resolveRefs(value, seen)]))
                    };
                case 'record':
                    if (!definition.property) return definition;
                    return { ...definition, property: resolveRefs(definition.property, seen) };
                case 'array':
                    return definition.itemDefinition ? { ...definition, itemDefinition: resolveRefs(definition.itemDefinition, seen) } : definition;
                case 'union':
                    return { ...definition, union: definition.union.map(item => resolveRefs(item, seen)) };
                default:
                    return definition;
            }
        };
        return resolveRefs(definition, new Set());
    }
}
