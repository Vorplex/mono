import { $Object } from './object.util';

describe($Object.getDefaults.name, () => {
    it('should return default values', () => {
        const object = {
            name: 'foo',
            age: null,
        };
        const defaults = {
            age: 23,
            dead: false,
        };
        const result = $Object.getDefaults(object, defaults);
        const expected = {
            name: 'foo',
            age: 23,
            dead: false,
        };
        expect(result).toEqual(expected);
    });
});
