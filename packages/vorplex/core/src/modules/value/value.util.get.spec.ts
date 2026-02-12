import { $Value } from './value.util';

describe($Value.get.name, () => {
    it('should return value at path', () => {
        const target = {
            child: {
                items: [{ name: 'foo' }],
            },
        };
        const value = $Value.get(target, 'child.items[0].name');
        expect(value).toEqual('foo');
    });
    it('should return undefined if path does not exist', () => {
        const target = {};
        const value = $Value.get(target, 'child.items[0].name');
        expect(value).toEqual(undefined);
    });
});
