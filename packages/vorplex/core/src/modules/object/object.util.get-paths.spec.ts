import { $Object } from './object.util';

describe($Object.getPaths.name, () => {
    function test(message: string, value: any, expected: string[]) {
        it(message, () => {
            const paths = $Object.getPaths(value);
            expect(paths).toEqual(expected);
        });
    }

    // value
    test('should return empty array for string', '', []);
    test('should return empty array for number', 0, []);
    test('should return empty array for true', true, []);
    test('should return empty array for null', null, []);
    test('should return empty array for undefined', undefined, []);
    // object
    test('should return path for empty object', {}, []);
    test('should return path for object', { name: 'foo' }, ['name']);
    test('should return path for object with multiple properties', { name: 'foo', flag: 'bar' }, ['name', 'flag']);
    test('should return path for object with nested properties', { nested: { name: 'foo' } }, ['nested.name']);
    // array
    test('should return path for empty array', [], []);
    test('should return path for array', [{ name: 'foo' }], ['0.name']);
    test('should return path for array with multiple items', [{ name: 'foo' }, { name: 'bar' }], ['0.name', '1.name']);
    test('should return path for array with nested array', [[{ name: 'foo' }]], ['0.0.name']);
});
