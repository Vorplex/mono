import { $Reflection } from '../utils/reflection.util';

describe($Reflection.name, () => {

    describe($Reflection.getParameterNames.name, () => {
        class Sample {
            public result: any = (g: number = 1) => { };
            public test(d: number, e: string = 'def') { }
            constructor(a: string, b = 2, c = 'test') { a + b + c; }
        }
        it('should return the parameter names of the specified function.', () => {
            const func = (a: any, b = 2, c = 'test', ...rest: any[]) => { function sum(...args: string[]) { sum(a + b + c); }; };
            expect($Reflection.getParameterNames(func)).toEqual(['a', 'b', 'c', 'rest']);
            expect($Reflection.getParameterNames(Sample)).toEqual(['g']);
            expect($Reflection.getParameterNames(Sample, 'test')).toEqual(['d', 'e']);
            expect($Reflection.getParameterNames(Sample, 'constructor')).toEqual(['a', 'b', 'c']);
        });
    });

    describe($Reflection.hasProperty.name, () => {
        it('should return true if the specified target has a property of the given name.', () => {
            const obj = {
                property: ''
            };
            expect($Reflection.hasProperty(obj, 'property')).toBeTruthy();
            expect($Reflection.hasProperty(obj, 'property2' as string)).toBeFalsy();
            expect($Reflection.hasProperty(null, 'property')).toBeFalsy();
        });
    });

    describe($Reflection.getProtoType.name, () => {
        class Sample { }
        it('should returns the type associate to the given `prototype`', () => {
            expect($Reflection.getProtoType(Sample.prototype)).toEqual(Sample);
        });
    });

    describe($Reflection.isArray.name, () => {
        it('should return true for array types.', () => {
            const items = ['A', 0, {}];
            expect($Reflection.isArray(items)).toBeTruthy();
            expect($Reflection.isArray({})).toBeFalsy();
            expect($Reflection.isArray('')).toBeFalsy();
            expect($Reflection.isArray(0)).toBeFalsy();
        });
        it('should return true for arrays with a specific type.', () => {
            const odd = ['A', 0, {}];
            const even = ['A', 'B'];
            expect($Reflection.isArray(odd, String)).toBeFalsy();
            expect($Reflection.isArray(even, String)).toBeTruthy();
            expect($Reflection.isArray(even, Object)).toBeFalsy();
        });
    });

    describe($Reflection.getType.name, () => {
        it('should return the type of the given value.', () => {
            expect($Reflection.getType('')).toEqual(String);
            expect($Reflection.getType(true)).toEqual(Boolean);
            expect($Reflection.getType(0)).toEqual(Number);
            expect($Reflection.getType(new Date())).toEqual(Date);
            expect($Reflection.getType([])).toEqual(Array);
            expect($Reflection.getType({})).toEqual(Object);
            expect($Reflection.getType(null)).toEqual(null);
            expect($Reflection.getType(undefined)).toEqual(undefined);
            expect($Reflection.getType(() => { })).toEqual(Function);
            expect($Reflection.getType(Symbol(''))).toEqual(Symbol);
        });
    });

    describe($Reflection.isPrimitive.name, () => {
        it('should return true for primitive types.', () => {
            expect($Reflection.isPrimitive(null)).toBeTruthy();
            expect($Reflection.isPrimitive(0)).toBeTruthy();
            expect($Reflection.isPrimitive(true)).toBeTruthy();
            expect($Reflection.isPrimitive('')).toBeTruthy();
            expect($Reflection.isPrimitive(new Date())).toBeFalsy();
            expect($Reflection.isPrimitive(Symbol(''))).toBeFalsy();
            expect($Reflection.isPrimitive({})).toBeFalsy();
            expect($Reflection.isPrimitive([])).toBeFalsy();
            expect($Reflection.isPrimitive(() => { })).toBeFalsy();
        });
    });

    describe($Reflection.isReference.name, () => {
        it('should return true for reference types.', () => {
            expect($Reflection.isReference($Reflection)).toBeTruthy();
            expect($Reflection.isReference(Symbol())).toBeTruthy();
            expect($Reflection.isReference({})).toBeTruthy();
            expect($Reflection.isReference([])).toBeTruthy();
            expect($Reflection.isReference(() => { })).toBeTruthy();
            expect($Reflection.isReference(new Date())).toBeTruthy();
            expect($Reflection.isReference(null)).toBeFalsy();
            expect($Reflection.isReference(0)).toBeFalsy();
            expect($Reflection.isReference(true)).toBeFalsy();
            expect($Reflection.isReference('')).toBeFalsy();
        });
    });

    describe($Reflection.isReferenceType.name, () => {
        it('should return true for reference types.', () => {
            expect($Reflection.isReferenceType(Date)).toBeTruthy();
            expect($Reflection.isReferenceType(Array)).toBeTruthy();
            expect($Reflection.isReferenceType(Object)).toBeTruthy();
            expect($Reflection.isReferenceType(Function)).toBeTruthy();
            expect($Reflection.isReferenceType(Symbol)).toBeTruthy();
            expect($Reflection.isReferenceType(String)).toBeFalsy();
            expect($Reflection.isReferenceType(Number)).toBeFalsy();
            expect($Reflection.isReferenceType(Boolean)).toBeFalsy();
            expect($Reflection.isReferenceType(null)).toBeFalsy();
        });
    });

    describe($Reflection.getDefault.name, () => {
        it('should return the default value of the given type.', () => {
            expect($Reflection.getDefault(String)).toEqual('');
            expect($Reflection.getDefault(Number)).toEqual(0);
            expect($Reflection.getDefault(Boolean)).toEqual(false);
            expect($Reflection.getDefault(Date)).toEqual(0);
            expect($Reflection.getDefault(Array)).toEqual([]);
            expect($Reflection.getDefault(Object)).toEqual(null);
            expect($Reflection.getDefault(Symbol)).toEqual(null);
        });
    });

    describe($Reflection.isType.name, () => {
        it('should check if value is a type', () => {
            expect($Reflection.isType(String)).toBeTruthy();
            expect($Reflection.isType(Number)).toBeTruthy();
            expect($Reflection.isType(Boolean)).toBeTruthy();
            expect($Reflection.isType(Date)).toBeTruthy();
            expect($Reflection.isType(Array)).toBeTruthy();
            expect($Reflection.isType(Object)).toBeTruthy();
            expect($Reflection.isType('')).toBeFalsy();
            expect($Reflection.isType([])).toBeFalsy();
            expect($Reflection.isType(1)).toBeFalsy();
            expect($Reflection.isType(true)).toBeFalsy();
            expect($Reflection.isType(null)).toBeFalsy();
            expect($Reflection.isType(new Date())).toBeFalsy();
            expect($Reflection.isType([])).toBeFalsy();
            expect($Reflection.isType({})).toBeFalsy();
        });
    });

    describe($Reflection.isValidDate.name, () => {
        it('should check if date is valid', () => {
            expect($Reflection.isValidDate(0)).toBeTruthy();
            expect($Reflection.isValidDate(new Date(0))).toBeTruthy();
            expect($Reflection.isValidDate(new Date().toString())).toBeTruthy();
            expect($Reflection.isValidDate('')).toBeFalsy();
            expect($Reflection.isValidDate(new Date('inv'))).toBeFalsy();
        });
    });

    describe($Reflection.isObject.name, () => {
        it('should true if the value is of type Object.', () => {
            expect($Reflection.isObject({})).toBeTruthy();
            expect($Reflection.isObject(String)).toBeFalsy();
            expect($Reflection.isObject(null)).toBeFalsy();
            expect($Reflection.isObject(0)).toBeFalsy();
            expect($Reflection.isObject(true)).toBeFalsy();
            expect($Reflection.isObject('')).toBeFalsy();
            expect($Reflection.isObject(Symbol())).toBeFalsy();
            expect($Reflection.isObject([])).toBeFalsy();
            expect($Reflection.isObject(() => { })).toBeFalsy();
            expect($Reflection.isObject(new Date())).toBeFalsy();
        });
    });

    describe($Reflection.isSymbol.name, () => {
        it('should true if the value is of type Symbol.', () => {
            expect($Reflection.isSymbol(Symbol())).toBeTruthy();
            expect($Reflection.isSymbol({})).toBeFalsy();
            expect($Reflection.isSymbol(null)).toBeFalsy();
            expect($Reflection.isSymbol(0)).toBeFalsy();
            expect($Reflection.isSymbol(true)).toBeFalsy();
            expect($Reflection.isSymbol('')).toBeFalsy();
            expect($Reflection.isSymbol([])).toBeFalsy();
            expect($Reflection.isSymbol(() => { })).toBeFalsy();
        });
    });

    describe($Reflection.getProperties.name, () => {
        it('should return the properties of the given object.', () => {
            const properties = $Reflection.getProperties({ property: '', method: () => { } });
            expect(properties.length).toEqual(1);
            expect(properties[0]).toEqual('property');
        });
    });

    describe($Reflection.getBaseType.name, () => {
        it('should return the base of the given object.', () => {
            class Base { }
            class SampleBase extends Base { }
            class Sample extends SampleBase { }
            expect($Reflection.getBaseType(new Sample())).toEqual(SampleBase);
            expect($Reflection.getBaseType(new SampleBase())).toEqual(Base);
            expect($Reflection.getBaseType(new Base())).toEqual(null);
            expect($Reflection.getBaseType(null)).toEqual(undefined);
        });
    });

    describe($Reflection.getTypeBases.name, () => {
        it('should return the base of the given type.', () => {
            class Base { }
            class SampleBase extends Base { }
            class Sample extends SampleBase { }
            expect($Reflection.getTypeBases(Sample)).toEqual([SampleBase, Base, Object]);
        });
    });

    describe($Reflection.extends.name, () => {
        it('should return true if the given type extends the base.', () => {
            class Base { }
            class SampleBase extends Base { }
            class Sample extends SampleBase { }
            expect($Reflection.extends(Sample, SampleBase)).toBeTruthy();
            expect($Reflection.extends(Sample, Base)).toBeTruthy();
            expect($Reflection.extends(SampleBase, Sample)).toBeFalsy();
        });
    });

    describe($Reflection.setType.name, () => {
        it('should assign the given type to the value', () => {
            class Sample { }
            expect($Reflection.setType('', null)).toEqual('');
            expect($Reflection.setType(null, String)).toEqual(null);
            expect($Reflection.setType('0', Number)).toEqual(0);
            expect($Reflection.setType(0, String)).toEqual('0');
            expect($Reflection.setType(0, Boolean)).toEqual(false);
            expect($Reflection.setType({}, Sample) instanceof Sample).toBeTruthy();
        });
    });

    describe($Reflection.defineProperty.name, () => {
        it('should add a property to a type', () => {
            class Sample { }
            let value = 'A';
            $Reflection.defineProperty(Sample, 'prop', () => value, (val) => value = val);
            const object: any = new Sample();
            expect(object.prop).toEqual('A');
            object.prop = 'B';
            expect(object.prop).toEqual('B');
        });

        it('should add a property to an object', () => {
            const object: any = {};
            let value = 'A';
            $Reflection.defineProperty(object, 'prop', () => value, (val) => value = val);
            expect(object.prop).toEqual('A');
            object.prop = 'B';
            expect(object.prop).toEqual('B');
        });

    });

    describe($Reflection.getTypeName.name, () => {
        function test(value: any, expected: string) {
            const result = $Reflection.getTypeName(value);
            expect(result).toEqual(expected);
        }

        it('should return the name of the type', () => {
            test(String, 'String');
            test('test', 'String');
            test(Symbol, 'Symbol');
            test(Symbol('Test'), 'Symbol(Test)');
            test(class Test { }, 'Test');
            test((() => { class Test { }; return new Test(); })(), 'Test');
            test(null, 'null');
            test(undefined, 'undefined');
        });
    });

    describe($Reflection.getSimpleTypeName.name, () => {
        function test(name: string, value: any, expected: string) {
            it(name, () => {
                const result = $Reflection.getSimpleTypeName(value);
                expect(result).toEqual(expected);
            });
        }

        test('should return `type` for types', String, 'type');
        test('should return `string` for strings', 'test', 'string');
        test('should return `number` for numbers', 0, 'number');
        test('should return `boolean` for booleans', true, 'boolean');
        test('should return `bigint` for bigints', BigInt(1), 'bigint');
        test('should return `number` for Nan', NaN, 'number');
        test('should return `symbol` for symbols', Symbol('Test'), 'symbol');
        test('should return `type` for class', class Test { }, 'type');
        test('should return `null` for null', null, 'null');
        test('should return `null` for undefined', undefined, 'null');
        test('should return `date` for dates', new Date(), 'date');
    });
});
