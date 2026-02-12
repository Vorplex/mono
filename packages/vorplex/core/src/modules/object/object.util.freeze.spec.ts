import { $Object } from './object.util';

describe($Object.freeze.name, () => {
    it('should make a value immutable', () => {
        const object = {
            property: '',
            items: [{ property: '' }],
            object: { property: '' },
            function: () => {},
        };
        $Object.freeze(object);
        expect(() => {
            object.property = '';
        }).toThrow();
        expect(() => {
            object['property'] = '';
        }).toThrow();
        expect(() => {
            Object.assign(object, { property: '' });
        }).toThrow();
        expect(() => {
            object.items.push({ property: '' });
        }).toThrow();
        expect(() => {
            object.items[0].property = '';
        }).toThrow();
        expect(() => {
            object.object.property = '';
        }).toThrow();
        expect(() => {
            object.function = () => {};
        }).toThrow();
    });
});
