import { $Value } from './value.util';

describe($Value.clone.name, () => {
    function test(message: string, value: any) {
        it(message, () => {
            const clone = $Value.clone(value);
            expect(clone).toEqual(value);
        });
    }
    // value
    test('should return value if not defined', undefined);
    test('should return value if not defined', null);
    test('should clone string', 'a');
    // object
    test('should clone object', { name: 'foo' });
    test('should clone nested object', { name: 'foo', child: { name: 'bar' } });
    it('should clone object and maintain reference', () => {
        const user = { name: 'foo' };
        const value = { a: user, b: user };
        const clone = $Value.clone(value);
        expect(clone).toEqual(value);
        expect(clone.a).toBe(clone.b);
    });
    // array
    test('should clone array', [0, 1, 2]);
    test('should clone array', [{ name: 'foo' }]);
});
