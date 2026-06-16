import type { TsonDefinition } from '../schema';
import { TsonString, type TsonStringDefinition } from './string';

describe(TsonString.name, () => {
    describe(TsonString.prototype.getDefault.name, () => {
        it('should return empty string', () => {
            const definition = new TsonString({ type: 'string' });
            const result = definition.getDefault();
            expect(result).toEqual('');
        });
        it('should return default', () => {
            const definition = new TsonString({ type: 'string', default: 'a' });
            const result = definition.getDefault();
            expect(result).toEqual('a');
        });
    });

    describe(TsonString.prototype.accepts.name, () => {
        it('should return false for definitions failing validation', () => {
            const tests: {
                definition: TsonStringDefinition;
                accepts: TsonDefinition[];
                rejects: TsonDefinition[];
            }[] = [
                    {
                        definition: { type: 'string' },
                        accepts: [{ type: 'any' }, { type: 'string' }],
                        rejects: [
                            { type: 'boolean' },
                            { type: 'number' },
                            { type: 'object' },
                            { type: 'array' },
                            { type: 'enum', flags: [] },
                            { type: 'union', union: [] },
                        ],
                    },
                    {
                        definition: { type: 'string', match: '/a/' },
                        accepts: [{ type: 'string', match: '/a/' }],
                        rejects: [{ type: 'string' }, { type: 'string', match: '/a*/' }],
                    },
                    {
                        definition: { type: 'string', min: 2 },
                        accepts: [
                            { type: 'string', min: 2 },
                            { type: 'string', min: 3 },
                        ],
                        rejects: [{ type: 'string' }, { type: 'string', min: 1 }],
                    },
                    {
                        definition: { type: 'string', max: 2 },
                        accepts: [
                            { type: 'string', max: 2 },
                            { type: 'string', max: 1 },
                        ],
                        rejects: [{ type: 'string' }, { type: 'string', max: 3 }],
                    },
                ];
            for (const test of tests) {
                const schema = new TsonString(test.definition);
                for (const accept of test.accepts) {
                    const result = schema.accepts(accept);
                    try {
                        expect(result).toEqual(true);
                    } catch (error) {
                        console.error({
                            definition: test.definition,
                            accepts: accept,
                        });
                        throw error;
                    }
                }
                for (const accept of test.rejects) {
                    const result = schema.accepts(accept);
                    expect(result).toEqual(false);
                }
            }
        });

        it('should accept compatible definitions with defaults', () => {
            const schema = new TsonString();
            const result = schema.accepts({ type: 'string', default: 'root' });
            expect(result).toEqual(true);
        });
    });

    describe(TsonString.prototype.parse.name, () => {
        it('should return value', () => {
            const schema = new TsonString();
            const [value, errors] = schema.parse('a');
            expect(errors).toHaveLength(0);
            expect(value).toBe('a');
        });
        it('should return default', () => {
            const values = [undefined, null];
            for (const value of values) {
                const schema = new TsonString({ type: 'string', default: 'a' });
                const [result, errors] = schema.parse(value);
                expect(errors).toHaveLength(0);
                expect(result).toEqual('a');
            }
        });
        it('should return an error for non-string types', () => {
            const values = [0, true, {}, [], () => { }];
            for (const value of values) {
                const schema = new TsonString();
                const [, errors] = schema.parse(value);
                expect(errors[0]?.message).toBe('String expected');
            }
        });
        it('should collect all constraint errors when not fail-fast', () => {
            const schema = new TsonString({ type: 'string', min: 5, max: 3 });
            const [, errors] = schema.parse('abcd', false);
            expect(errors.length).toBeGreaterThan(1);
        });
    });
});
