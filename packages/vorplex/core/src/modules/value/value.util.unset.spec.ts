import { $Value } from './value.util';

describe($Value.unset.name, () => {
    it('should unset property of object', () => {
        const target = {
            name: 'foo',
        };
        const result = $Value.unset(target, 'name');
        expect('name' in result).toBeFalsy();
    });
});
