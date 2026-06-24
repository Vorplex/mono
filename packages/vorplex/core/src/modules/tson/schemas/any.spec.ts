import { TsonAny } from './any';

describe(TsonAny.name, () => {

    describe(TsonAny.prototype.accepts.name, () => {
        it('should return true', () => {
            const schema = new TsonAny();
            const result = schema.accepts({ type: 'any' });
            expect(result).toEqual(true);
        });

        it('should reject missing definitions unless defaulted', () => {
            expect(new TsonAny().accepts(undefined)).toEqual(false);
            expect(new TsonAny({ type: 'any', default: { value: undefined } }).accepts(undefined)).toEqual(true);
        });
    });

    describe(TsonAny.prototype.parse.name, () => {
        it('should return value', () => {
            const value = {};
            const schema = new TsonAny();
            const [result, errors] = schema.parse(value);
            expect(errors).toHaveLength(0);
            expect(result).toBe(value);
        });
        it('should return default', () => {
            const value = null;
            const schema = new TsonAny({ type: 'any', default: { value: 'a' } });
            const [result, errors] = schema.parse(value);
            expect(errors).toHaveLength(0);
            expect(result).toEqual('a');
        });
    });
});
