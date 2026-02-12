import { TsonAny } from './any';

describe(TsonAny.name, () => {
    describe(TsonAny.prototype.getDefault.name, () => {
        it('should return undefined', () => {
            const definition = new TsonAny({ type: 'any' });
            const result = definition.getDefault();
            expect(result).toEqual(undefined);
        });
        it('should return default', () => {
            const definition = new TsonAny({ type: 'any', default: 'a' });
            const result = definition.getDefault();
            expect(result).toEqual('a');
        });
    });

    describe(TsonAny.prototype.accepts.name, () => {
        it('should return true', () => {
            const schema = new TsonAny();
            const result = schema.accepts({ type: 'any' });
            expect(result).toEqual(true);
        });
    });

    describe(TsonAny.prototype.parse.name, () => {
        it('should return value', () => {
            const value = {};
            const schema = new TsonAny();
            const result = schema.parse(value);
            expect(result).toBe(value);
        });
        it('should return default', () => {
            const value = null;
            const schema = new TsonAny({ type: 'any', default: 'a' });
            const result = schema.parse(value);
            expect(result).toEqual('a');
        });
    });
});
