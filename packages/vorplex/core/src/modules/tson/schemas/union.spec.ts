import type { TsonDefinition } from '../schema';
import { TsonUnion } from './union';

describe(TsonUnion.name, () => {
    describe(TsonUnion.prototype.getDefault.name, () => {
        it('should return undefined when no default is set', () => {
            const schema = new TsonUnion({ type: 'union', union: [{ type: 'string' }] });
            expect(schema.getDefault()).toBeUndefined();
        });
    });

    describe(TsonUnion.prototype.accepts.name, () => {
        it('should accept matching non-union definitions', () => {
            const schema = new TsonUnion({ type: 'union', union: [{ type: 'string' }, { type: 'number' }] });
            expect(schema.accepts({ type: 'string' })).toEqual(true);
            expect(schema.accepts({ type: 'number' })).toEqual(true);
            expect(schema.accepts({ type: 'boolean' })).toEqual(false);
        });

        it('should accept any', () => {
            const schema = new TsonUnion({ type: 'union', union: [{ type: 'string' }] });
            expect(schema.accepts({ type: 'any' })).toEqual(true);
        });

        it('should accept a union that is a subset of its members', () => {
            const schema = new TsonUnion({ type: 'union', union: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }] });
            const subset: TsonDefinition = { type: 'union', union: [{ type: 'string' }, { type: 'number' }] };
            expect(schema.accepts(subset)).toEqual(true);
        });

        it('should reject a union with members it does not cover', () => {
            const schema = new TsonUnion({ type: 'union', union: [{ type: 'string' }, { type: 'number' }] });
            const notCovered: TsonDefinition = { type: 'union', union: [{ type: 'string' }, { type: 'boolean' }] };
            expect(schema.accepts(notCovered)).toEqual(false);
        });

        it('should accept null/undefined only when a default is configured', () => {
            const withDefault = new TsonUnion({ type: 'union', union: [{ type: 'string' }], default: undefined });
            expect(withDefault.accepts(undefined)).toEqual(true);
            expect(withDefault.accepts(null)).toEqual(true);

            const withoutDefault = new TsonUnion({ type: 'union', union: [{ type: 'string' }] });
            expect(withoutDefault.accepts(null)).toEqual(false);
        });

        it('should resolve through nested members (array of union, object with union property)', () => {
            const schema = new TsonUnion({
                type: 'union',
                union: [
                    { type: 'array', itemDefinition: { type: 'union', union: [{ type: 'string' }, { type: 'number' }] } },
                    { type: 'boolean' },
                ],
            });

            expect(schema.accepts({ type: 'array', itemDefinition: { type: 'union', union: [{ type: 'string' }, { type: 'number' }] } })).toEqual(true);
            expect(schema.accepts({ type: 'array', itemDefinition: { type: 'string' } })).toEqual(true);
            expect(schema.accepts({ type: 'array', itemDefinition: { type: 'object', properties: {} } })).toEqual(false);
            expect(schema.accepts({ type: 'object', properties: {} })).toEqual(false);
        });
    });

    describe(TsonUnion.prototype.parse.name, () => {
        it('should parse using the first matching member', () => {
            const schema = new TsonUnion({ type: 'union', union: [{ type: 'string' }, { type: 'number' }] });
            {
                const [value, errors] = schema.parse('a');
                expect(errors).toHaveLength(0);
                expect(value).toBe('a');
            }
            {
                const [value, errors] = schema.parse(5);
                expect(errors).toHaveLength(0);
                expect(value).toBe(5);
            }
        });

        it('should return undefined without error for null/undefined when a default is configured', () => {
            const schema = new TsonUnion({ type: 'union', union: [{ type: 'string' }], default: undefined });
            for (const value of [undefined, null]) {
                const [result, errors] = schema.parse(value);
                expect(errors).toHaveLength(0);
                expect(result).toBeUndefined();
            }
        });

        it('should error when no member matches', () => {
            const schema = new TsonUnion({ type: 'union', union: [{ type: 'string' }, { type: 'number' }] });
            const [, errors] = schema.parse(true);
            expect(errors[0]?.message).toBe('Union type mismatch');
        });

        it('should parse nested members: arrays of unions and objects with union properties', () => {
            const schema = new TsonUnion({
                type: 'union',
                union: [
                    {
                        type: 'array',
                        itemDefinition: { type: 'union', union: [{ type: 'string' }, { type: 'number' }] },
                    },
                    {
                        type: 'object',
                        properties: {
                            tag: { type: 'string' },
                            value: { type: 'union', union: [{ type: 'string' }, { type: 'number' }] },
                        },
                    },
                ],
            });

            {
                const [value, errors] = schema.parse(['a', 1, 'b']);
                expect(errors).toHaveLength(0);
                expect(value).toEqual(['a', 1, 'b']);
            }
            {
                const [value, errors] = schema.parse({ tag: 'x', value: 5 });
                expect(errors).toHaveLength(0);
                expect(value).toEqual({ tag: 'x', value: 5 });
            }
            {
                const [, errors] = schema.parse({ tag: 'x', value: true });
                expect(errors.length).toBeGreaterThan(0);
            }
        });

        it('should collect errors and fall through nested union-of-union members', () => {
            const schema = new TsonUnion({
                type: 'union',
                union: [
                    { type: 'union', union: [{ type: 'string' }, { type: 'number' }] },
                    { type: 'boolean' },
                ],
            });

            {
                const [value, errors] = schema.parse('a');
                expect(errors).toHaveLength(0);
                expect(value).toBe('a');
            }
            {
                const [value, errors] = schema.parse(true);
                expect(errors).toHaveLength(0);
                expect(value).toBe(true);
            }
            {
                const [, errors] = schema.parse({});
                expect(errors[0]?.message).toBe('Union type mismatch');
            }
        });
    });
});
