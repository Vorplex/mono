import { $Array } from '../../array/array.util';
import type { Parameter } from '../interfaces/parameter.interface';
import type { Type } from '../types/type.type';
import { $Reflection } from './reflection.util';

export abstract class Decorator<T = any> {
    constructor(public type: Type, public data: T) {}
}

export class ClassDecorator<T = any> extends Decorator<T> {
    constructor(type: Type, data: T) {
        super(type, data);
    }
}

export class ConstructorParameterDecorator<T = any> extends Decorator<T> {
    constructor(type: Type, public parameter: Parameter, data: T) {
        super(type, data);
    }
}

export class PropertyDecorator<T = any> extends Decorator<T> {
    constructor(type: Type, public property: string, data: T) {
        super(type, data);
    }
}

export class MethodDecorator<T = any> extends Decorator<T> {
    constructor(type: Type, public method: string, data: T) {
        super(type, data);
    }
}

export class ParameterDecorator<T = any> extends Decorator<T> {
    constructor(type: Type, public method: string, public parameter: Parameter, data: T) {
        super(type, data);
    }
}

export interface DecoratorQuery<T extends Decorator> {
    target: any;
    type?: Type<T>;
    first?: boolean;
}

export interface ClassDecoratorQuery<T extends Decorator> extends DecoratorQuery<T> {
    kind: 'class';
}

export interface ConstructorParameterDecoratorQuery<T extends Decorator> extends DecoratorQuery<T> {
    kind: 'ctor-parameter';
    parameter?: string | number;
}

export interface PropertyDecoratorQuery<T extends Decorator> extends DecoratorQuery<T> {
    kind: 'property';
    property?: string;
}

export interface MethodDecoratorQuery<T extends Decorator> extends DecoratorQuery<T> {
    kind: 'method';
    method?: string;
}

export interface ParameterDecoratorQuery<T extends Decorator> extends DecoratorQuery<T> {
    kind: 'parameter';
    parameter?: string | number;
}

export type DecoratorQueries<T extends Decorator> =
    | DecoratorQuery<T>
    | ClassDecoratorQuery<T>
    | ConstructorParameterDecoratorQuery<T>
    | PropertyDecoratorQuery<T>
    | MethodDecoratorQuery<T>
    | ParameterDecoratorQuery<T>;

export class $Decorator {
    private static decorators: Decorator[] = [];

    public static createClassDecorator<T extends Type>(create: (type: T) => ClassDecorator) {
        return (target: T, _context: ClassDecoratorContext): void => {
            const decorator = create(target);
            $Decorator.create(decorator);
        };
    }

    public static createConstructorParameterDecorator(create: (type: Type, parameter: Parameter) => ConstructorParameterDecorator) {
        return (_target: undefined, context: ClassFieldDecoratorContext) => {
            return function (this: any, initialValue: any) {
                const type = this.constructor as Type;
                const parameterNames = $Reflection.getParameterNames(type, 'constructor');
                const index = parameterNames.indexOf(context.name as string);
                const decorator = create(type, { index, name: context.name as string });
                $Decorator.create(decorator);
                return initialValue;
            };
        };
    }

    public static createPropertyDecorator(create: (type: Type, property: string) => PropertyDecorator) {
        return <T, V>(_target: ClassAccessorDecoratorTarget<T, V>, context: ClassAccessorDecoratorContext<T, V>) => {
            return {
                init(this: T, initialValue: V) {
                    const type = (this as any).constructor as Type;
                    const decorator = create(type, context.name as string);
                    $Decorator.create(decorator);
                    return initialValue;
                },
            };
        };
    }

    public static createMethodDecorator(create: (type: Type, method: string) => MethodDecorator) {
        return <T, A extends any[], R>(target: (this: T, ...args: A) => R, context: ClassMethodDecoratorContext<T, (this: T, ...args: A) => R>) => {
            context.addInitializer(function (this: T) {
                const decorator = create((this as any).constructor as Type, context.name as string);
                $Decorator.create(decorator);
            });
            return target;
        };
    }

    public static createParameterDecorator(create: (type: Type, method: string, parameter: Parameter) => ParameterDecorator) {
        return (methodName: string, parameterIndex: number, parameterName: string) => {
            return <T extends abstract new (...args: any) => any>(target: T, _context: ClassDecoratorContext<T>): void => {
                const decorator = create(target as unknown as Type, methodName, { index: parameterIndex, name: parameterName });
                $Decorator.create(decorator);
            };
        };
    }

    public static create(decorator: Decorator) {
        $Decorator.decorators.push(decorator);
    }

    public static destroy(decorator: Decorator) {
        $Decorator.decorators = $Array.remove($Decorator.decorators, decorator);
    }

    public static get<T extends Decorator>(query: DecoratorQueries<T> & { first: true }): T;
    public static get<T extends Decorator>(query: DecoratorQueries<T> & { first?: false }): T[];
    public static get<T extends Decorator>(query: DecoratorQueries<T>): T | T[] {
        const type = $Reflection.isType(query.target) ? query.target : $Reflection.getType(query.target);
        const decorators: T[] = [];
        for (const decorator of $Decorator.decorators) {
            if (!$Reflection.extends(type, decorator.type)) continue;
            if (query.type && !$Reflection.instanceOf(decorator, query.type)) continue;
            if ('kind' in query) {
                if (query.kind === 'class' && decorator instanceof ClassDecorator) {
                } else if (query.kind === 'ctor-parameter' && decorator instanceof ConstructorParameterDecorator) {
                    if (query.parameter != null && decorator.parameter.index !== query.parameter && decorator.parameter.name !== query.parameter) continue;
                } else if (query.kind === 'method' && decorator instanceof MethodDecorator) {
                    if (query.method && decorator.method !== query.method) continue;
                } else if (query.kind === 'parameter' && decorator instanceof ParameterDecorator) {
                    if (query.parameter != null && decorator.parameter.index !== query.parameter && decorator.parameter.name !== query.parameter) continue;
                } else if (query.kind === 'property' && decorator instanceof PropertyDecorator) {
                    if (query.property && decorator.property !== query.property) continue;
                }
            }
            if (query.first) return decorator as T;
            decorators.push(decorator as T);
        }
        return query.first ? null : decorators;
    }
}
