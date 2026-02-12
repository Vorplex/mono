import type { TsonDefinition } from '../schema';
import { TsonBoolean } from './boolean';

describe(TsonBoolean.name, () => {
    describe(TsonBoolean.prototype.getDefault.name, () => {
        it('should return false', () => {
            const definition = new TsonBoolean({ type: 'boolean' });
            const result = definition.getDefault();
            expect(result).toEqual(false);
        });
        it('should return default', () => {
            const definition = new TsonBoolean({
                type: 'boolean',
                default: true,
            });
            const result = definition.getDefault();
            expect(result).toEqual(true);
        });
    });

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
                const result = schema.parse(value);
                expect(result).toBe(value);
            }
        });
        it('should return default', () => {
            const values = [undefined, null];
            for (const value of values) {
                const schema = new TsonBoolean({
                    type: 'boolean',
                    default: true,
                });
                const result = schema.parse(value);
                expect(result).toEqual(true);
            }
        });
        it('should throw an error for non-boolean types', () => {
            const values = [0, '', {}, [], () => { }];
            for (const value of values) {
                const schema = new TsonBoolean();
                expect(() => schema.parse(value)).toThrow('Boolean expected');
            }
        });
    });
});
