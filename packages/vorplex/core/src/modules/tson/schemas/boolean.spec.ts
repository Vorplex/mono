import type { TsonDefinition } from '../schema';
import { TsonBoolean } from './boolean';

describe(TsonBoolean.name, () => {

    describe(TsonBoolean.prototype.accepts.name, () => {
        it('should return true for accepted definitions', () => {
            const definitions: TsonDefinition[] = [{ type: 'any' }, { type: 'boolean' }];
            for (const definition of definitions) {
                const schema = new TsonBoolean();
                const result = schema.accepts(definition);
                expect(result).toEqual(true);
            }
        });
        it('should return false for unaccepted definitions', () => {
            const definitions: TsonDefinition[] = [
                { type: 'number' },
                { type: 'string' },
                { type: 'object' },
                { type: 'record' },
                { type: 'array' },
                { type: 'enum', flags: [] },
                { type: 'union', union: [] },
            ];
            for (const definition of definitions) {
                const schema = new TsonBoolean();
                const result = schema.accepts(definition);
                expect(result).toEqual(false);
            }
        });
    });

    describe(TsonBoolean.prototype.parse.name, () => {
        it('should return value', () => {
            const values = [false, true];
            for (const value of values) {
                const schema = new TsonBoolean();
                const [result, errors] = schema.parse(value);
                expect(errors).toHaveLength(0);
                expect(result).toBe(value);
            }
        });
        it('should return default', () => {
            const values = [undefined, null];
            for (const value of values) {
                const schema = new TsonBoolean({
                    type: 'boolean',
                    default: { value: true }
                });
                const [result, errors] = schema.parse(value);
                expect(errors).toHaveLength(0);
                expect(result).toEqual(true);
            }
        });
        it('should return an error for non-boolean types', () => {
            const values = [0, '', {}, [], () => { }];
            for (const value of values) {
                const schema = new TsonBoolean();
                const [, errors] = schema.parse(value);
                expect(errors[0]?.message).toBe('Boolean expected');
            }
        });
    });
});
