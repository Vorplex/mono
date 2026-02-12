import type { Constructor } from '../types/constructor.type';
import type { Type } from '../types/type.type';

export class $Reflection {
    private constructor() { }

    /**
     * Returns the names of the parameters of the given function
     *
     * @static
     * @template T
     * @param func The function definition
     * @param [name=''] The name of the function
     * @return {*} The names of the parameters
     */
    public static getParameterNames<T extends Function>(func: T, name: (keyof T['prototype'] & string) | 'constructor' = '' as any): string[] {
        const data = func.toString();
        const paramRegex = new RegExp(`(?:${name}|${func.name})\\(([^)]*)\\)`);
        const match = data.match(paramRegex);

        if (!match) return [];

        const paramsString = match[1].replace(/\/\*.*?\*\//g, '');
        const params = paramsString
            .split(',')
            .map((param) =>
                param
                    .trim()
                    .replace(/^\.\.\./, '')
                    .split('=')[0]
                    .trim()
                    .split(':')[0]
                    .replace(/@.*\(/, '')
                    .trim(),
            )
            .filter(Boolean);
        return params;
    }

    public static combineClasses(...classes: Constructor[]): Constructor {
        class DynamicClass { }
        for (const class$ of classes) {
            const keys = Object.getOwnPropertyNames(class$.prototype);
            for (const key of keys) {
                if (key !== 'constructor') {
                    const descriptor = Object.getOwnPropertyDescriptor(class$.prototype, key);
                    Object.defineProperty(DynamicClass.prototype, key, descriptor);
                }
            }
        }
        return DynamicClass;
    }

    /**
     * Returns true if the `target` contains a property called `name`.
     * @param target The object containing the property.
     * @param name The name of the property to check.
     */
    public static hasProperty<T>(target: object | Type<T>, name: string): boolean {
        return target && $Reflection.isObject(target) && name in target;
    }

    /**
     * Returns the type associate with the `prototype`.
     * @param prototype The prototype which type to return.
     */
    public static getProtoType(prototype: object): Type | null {
        return $Reflection.getType(Object.setPrototypeOf({}, prototype));
    }

    /**
     * Defines a property on `target` called `name` with the given `get` and `set`.
     *
     * @param target The object or type to define the property on.
     * @param name The name of the property.
     * @param get The getter of the property.
     * @param set The setter of the property.
     */
    public static defineProperty<T>(target: object | Type<T>, name: string, get: () => any, set: (value: any) => void) {
        target = $Reflection.isType(target) ? target.prototype : target;
        Object.defineProperty(target, name, {
            configurable: true,
            enumerable: true,
            get: get,
            set: set,
        });
    }

    /**
     * Returns the type of the `value`.
     * @param value The value which type to return.
     */
    public static getType(value: any): Type | null | undefined {
        return value?.__proto__?.constructor ?? value;
    }

    /**
     * Returns true if `value` is of a primitive type.
     * Primitive types are `undefined`, `null`, `String`, `Number`, `Boolean`.
     * @param value The value to check for primitive type.
     */
    public static isPrimitive(value: any): boolean {
        return [undefined, null, String, Number, Boolean].includes($Reflection.getType(value) as any);
    }

    /**
     * Returns true if `value` is of type function, lambda or class.
     * @param value The value to check.
     */
    public static isFunction(value: any): value is Function {
        return $Reflection.getType(value) === Function && (!value.prototype || !`${$Reflection.getProtoType(value.prototype)}`.startsWith('class'));
    }

    /**
     * Returns true if `value` is a type or function.
     * @param value The value to check.
     */
    public static isType<T = any>(value: any): value is Type<T> {
        return $Reflection.getType(value) === Function && !!value.prototype && $Reflection.getType(value.prototype) !== Function;
    }

    public static isValidDate(value: any): value is Date {
        return new Date(value).toString() !== 'Invalid Date';
    }

    /**
     * Returns true if `value` is of type `Object`.
     * @param value The value to check.
     */
    public static isObject(value: any): value is Record<string, any> {
        return value != null && !$Reflection.isArray(value) && typeof value === 'object' && !(value instanceof Date);
    }

    /**
     * Returns true if `value` is of type `Symbol`.
     * @param value The value to check.
     */
    public static isSymbol(value: any): value is symbol {
        return typeof value === 'symbol';
    }

    /**
     * Returns true if `value` is a reference type.
     * Reference types are `Object`, `Function`, `Array`, `Symbol`, `Date`.
     * @param value The value to check for reference type.
     */
    public static isReference(value: any): boolean {
        return value && ['object', 'function', 'symbol'].includes(typeof value);
    }

    /**
     * Returns true if `type` is a value type.
     * Value types are `undefined`, `null`, `String`, `Number`, `Boolean`.
     * @param type The type to check for value type.
     */
    public static isValueType(type: Type): boolean {
        return type == null || !![String, Boolean, Number].find((_type) => _type === type);
    }

    /**
     * Returns true if `type` is a reference type.
     * Reference types are `Object`, `Function`, `Array`, `Symbol`, `Date`.
     * @param value The type to check for reference type.
     */
    public static isReferenceType(type: Type): boolean {
        return !$Reflection.isValueType(type);
    }

    /**
     * Returns all the properties of `object`.
     * @param object The object which properties to return.
     */
    public static getProperties(object: object) {
        return Object.keys(object).filter((key) => !$Reflection.isFunction(object[key]));
    }

    /**
     * Returns the default value for `type`.
     * @param type The type which default value to return.
     * @example
     * String: ''
     * Number: 0
     * Boolean: false
     * Date: 0
     * Array: []
     * ...: null
     */
    public static getDefault(type: Type): any {
        switch (type) {
            case String:
                return '';
            case Number:
                return 0;
            case Boolean:
                return false;
            case Date:
                return 0;
            case Array:
                return [];
            default:
                return null;
        }
    }

    /**
     * Sets the type of `value` to `type`.
     * @param value The value which type to set.
     * @param type The type to apply to the value.
     */
    public static setType(value: any, type: Type): any {
        if (value == null || type == null) {
            return value;
        } else if (type === Number) {
            return Number(value);
        } else if (type === Boolean) {
            return Boolean(value);
        } else if (type === String) {
            return String(value);
        } else if (type === Date) {
            return new Date(value);
        } else {
            return Object.setPrototypeOf(value, type.prototype);
        }
    }

    /**
     * Returns true if `value` is of type `Array`.
     * @param value The value to check.
     * @param type The type of array to check for.
     */
    public static isArray(value: any, type?: Type): boolean {
        if (Array.isArray(value)) {
            if (type) {
                if ($Reflection.isValueType(type)) {
                    return value.every((item) => $Reflection.getType(item) === type);
                } else {
                    return value.every((item) => item instanceof type);
                }
            }
            return true;
        }
        return false;
    }

    /**
     * Returns true if `type` extends `base`.
     * @param type The type to check.
     * @param base The base of `type` to check.
     */
    public static extends(type: Type, base: Type): boolean {
        return type === base || $Reflection.getTypeBases(type).includes(base);
    }

    public static instanceOf(value: any, type: Type): boolean {
        return value instanceof type || $Reflection.extends($Reflection.getType(value), type);
    }

    /**
     * Returns all the base types of `type`.
     * @param type The type which base types to return.
     */
    public static getTypeBases(type: Type): Type[] {
        const types: Type[] = [];
        let base = $Reflection.getTypeBase(type);
        while (base) {
            types.push(base);
            base = $Reflection.getTypeBase(base);
        }
        if ($Reflection.isReferenceType(type)) {
            types.push(Object);
        }
        return types;
    }

    /**
     * Returns the base type of `value`.
     * @param value The value which base type to return.
     */
    public static getBaseType(value: any): Type {
        const type = $Reflection.getType(value);
        if (type) {
            return $Reflection.getTypeBase(type);
        }
    }

    /**
     * Returns the base type of `type`.
     * @param type The type which base type to return.
     */
    public static getTypeBase(type: Type): Type {
        if (type != null) {
            const base = Object.getPrototypeOf(type);
            return base !== Object.getPrototypeOf(Function) ? base : null;
        }
    }

    public static getTypeName(value: any) {
        return $Reflection.isType(value) ? value.name : $Reflection.isSymbol(value) ? String(value) : String($Reflection.getType(value)?.name ?? value);
    }

    public static getSimpleTypeName(value: any): 'string' | 'number' | 'object' | 'array' | 'type' | 'null' | 'boolean' | 'bigint' | 'symbol' | 'function' | 'date' {
        if (value == null) return 'null';
        if (typeof value === 'string') return 'string';
        if (typeof value === 'number') return 'number';
        if (typeof value === 'boolean') return 'boolean';
        if (typeof value === 'symbol') return 'symbol';
        if (typeof value === 'bigint') return 'bigint';
        if (value instanceof Date) return 'date';
        if ($Reflection.isType(value)) return 'type';
        if ($Reflection.isFunction(value)) return 'function';
        if (Array.isArray(value)) return 'array';
        if ($Reflection.isObject(value)) return 'object';
    }

    public static parsePrimitiveValue(value: string) {
        if (/^\d+$/.test(value)) return parseInt(value, 10);
        if (/^\d+\.\d+$/.test(value)) return parseFloat(value);
        if (value.toLowerCase() === 'true') return true;
        if (value.toLowerCase() === 'false') return false;
        return value;
    }
}
