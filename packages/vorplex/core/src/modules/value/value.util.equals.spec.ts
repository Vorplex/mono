import { $Value } from './value.util';

describe($Value.equals.name, () => {
    it('should return true if objects are equal', () => {
        const a = { name: 'foo' };
        const b = { name: 'foo' };
        const result = $Value.equals(a, b);
        expect(result).toBeTruthy();
    });
    it('should return true if arrays are equal', () => {
        const a = [{ name: 'foo' }];
        const b = [{ name: 'foo' }];
        const result = $Value.equals(a, b);
        expect(result).toBeTruthy();
    });
});
