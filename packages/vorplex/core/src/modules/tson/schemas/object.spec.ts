import { $Tson } from '../tson';
import { TsonObject } from './object';

describe(TsonObject.name, () => {
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
