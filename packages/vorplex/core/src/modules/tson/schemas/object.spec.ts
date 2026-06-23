import { $Tson } from '../tson';
import { TsonObject } from './object';

describe(TsonObject.name, () => {
    describe(TsonObject.prototype.getDefault.name, () => {
        it('should return empty object when no schema is defined', () => {
            const schema = new TsonObject({ type: 'object' });
            expect(schema.getDefault()).toEqual({});
        });

        it('should return the explicit default over computed property defaults', () => {
            const schema = new TsonObject({
                type: 'object',
                default: { name: 'override' },
                properties: { name: $Tson.string({ default: 'fallback' }) },
            });
            expect(schema.getDefault()).toEqual({ name: 'override' });
        });

        it('should compute defaults from properties when no default is set', () => {
            const schema = new TsonObject({
                type: 'object',
                properties: { name: $Tson.string({ default: 'fallback' }) },
            });
            expect(schema.getDefault()).toEqual({ name: 'fallback' });
        });
    });

    describe(TsonObject.prototype.parse.name, () => {
        it('should return an error for non-object types', () => {
            const schema = new TsonObject({ type: 'object', properties: {} });
            const values = ['a', 0, true];
            for (const value of values) {
                const [, errors] = schema.parse(value);
                expect(errors[0]?.message).toBe('Object expected');
            }
        });
    });

    describe(TsonObject.prototype.accepts.name, () => {
        it('should reject object definitions missing required properties', () => {
            const schema = new TsonObject({
                type: 'object',
                properties: {
                    name: $Tson.string(),
                },
            });

            const result = schema.accepts({
                type: 'object',
                properties: {},
            });

            expect(result).toEqual(false);
        });

        it('should accept object definitions missing optional properties', () => {
            const schema = new TsonObject({
                type: 'object',
                properties: {
                    name: $Tson.string({ default: undefined }),
                },
            });

            const result = schema.accepts({
                type: 'object',
                properties: {},
            });

            expect(result).toEqual(true);
        });

        it('should reject object definitions missing required any properties', () => {
            const schema = new TsonObject({
                type: 'object',
                properties: {
                    value: $Tson.any(),
                },
            });

            const result = schema.accepts({
                type: 'object',
                properties: {},
            });

            expect(result).toEqual(false);
        });

        it('should accept object definitions with defaulted required properties present', () => {
            const schema = new TsonObject({
                type: 'object',
                properties: {
                    name: $Tson.string(),
                },
            });

            const result = schema.accepts({
                type: 'object',
                properties: {
                    name: $Tson.string({ default: 'root' }),
                },
            });

            expect(result).toEqual(true);
        });
    });
});
