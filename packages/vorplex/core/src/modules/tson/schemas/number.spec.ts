import type { TsonDefinition } from '../schema';
import { TsonNumber, type TsonNumberDefinition } from './number';

describe(TsonNumber.name, () => {
    describe(TsonNumber.prototype.getDefault.name, () => {
        it('should return 0', () => {
            const definition = new TsonNumber({ type: 'number' });
            const result = definition.getDefault();
            expect(result).toEqual(0);
        });
        it('should return default', () => {
            const definition = new TsonNumber({ type: 'number', default: 2 });
            const result = definition.getDefault();
            expect(result).toEqual(2);
        });
    });

    describe(TsonNumber.prototype.accepts.name, () => {
        it('should return false for definitions failing validation', () => {
            const tests: {
                definition: TsonNumberDefinition;
                accepts: TsonDefinition[];
                rejects: TsonDefinition[];
            }[] = [
                    {
                        definition: { type: 'number' },
                        accepts: [{ type: 'any' }, { type: 'number' }],
                        rejects: [
                            { type: 'boolean' },
                            { type: 'string' },
                            { type: 'object' },
                            { type: 'array' },
                            { type: 'enum', flags: [] },
                            { type: 'union', union: [] },
                        ],
                    },
                    {
                        definition: { type: 'number', integer: true },
                        accepts: [{ type: 'number', integer: true }],
                        rejects: [{ type: 'number' }],
                    },
                    {
                        definition: { type: 'number', min: 2 },
                        accepts: [
                            { type: 'number', min: 2 },
                            { type: 'number', min: 3 },
                        ],
                        rejects: [{ type: 'number' }, { type: 'number', min: 1 }],
                    },
                    {
                        definition: { type: 'number', max: 2 },
                        accepts: [
                            { type: 'number', max: 2 },
                            { type: 'number', max: 1 },
                        ],
                        rejects: [{ type: 'number' }, { type: 'number', min: 3 }],
                    },
                ];
            for (const test of tests) {
                const schema = new TsonNumber(test.definition);
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
    });

    describe(TsonNumber.prototype.parse.name, () => {
        it('should return value', () => {
            const values = [0, -1, 1, 1.1];
            for (const value of values) {
                const schema = new TsonNumber();
                const result = schema.parse(value);
                expect(result).toBe(value);
            }
        });
        it('should return default', () => {
            const values = [undefined, null];
            for (const value of values) {
                const schema = new TsonNumber({ type: 'number', default: 2 });
                const result = schema.parse(value);
                expect(result).toEqual(2);
            }
        });
        it('should throw an error for non-number types', () => {
            const values = ['', true, {}, [], () => { }];
            for (const value of values) {
                const schema = new TsonNumber();
                expect(() => schema.parse(value)).toThrow('Number expected');
            }
        });
    });
});
