import { $Tson } from './tson';

describe($Tson.name, () => {
    describe($Tson.any, () => {
        it('should return any definition', () => {
            const result = $Tson.any();
            expect(result).toEqual({ type: 'any' });
        });
    });

    describe($Tson.parse, () => {
        it('should return parsed any definition', () => {
            const result = $Tson.parse($Tson.any());
        });
    });

    describe($Tson.extends.name, () => {
        it('should merge object properties', () => {
            const base = $Tson.object({
                properties: {
                    id: $Tson.string(),
                },
            });
            const definition = $Tson.object({
                properties: {
                    name: $Tson.string(),
                }
            });
            const result = $Tson.extends(base, definition);
            expect(result).toEqual({
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                },
            });
        });

        it('should override existing object properties', () => {
            const base = $Tson.object({
                description: 'value',
                default: { value: { value: '' } },
                properties: {
                    value: $Tson.string(),
                },
            });
            const definition = $Tson.object({
                default: { value: { value: 0 } },
                properties: {
                    value: $Tson.number(),
                }
            });
            const result = $Tson.extends(base, definition);
            expect(result.description).toEqual('value');
            expect(result.default).toEqual({ value: { value: 0 } });
            expect(result.properties.value).toEqual({ type: 'number' });
        });
    });

    describe($Tson.generateTypeScriptDefinition.name, () => {
        it('should support bare object definitions', () => {
            const result = $Tson.generateTypeScriptDefinition($Tson.object());

            expect(result).toBe('Record<string, any>');
        });

        it('should support bare record definitions', () => {
            const result = $Tson.generateTypeScriptDefinition($Tson.record());

            expect(result).toBe(`{\n    [key: string]: any\n}`);
        });
    });

    describe($Tson.generateJsonSchema.name, () => {
        it('should support bare object definitions', () => {
            const result = $Tson.generateJsonSchema($Tson.object());

            expect(result).toEqual({ type: 'object' });
        });

        it('should support bare record definitions', () => {
            const result = $Tson.generateJsonSchema($Tson.record());

            expect(result).toEqual({
                type: 'object',
                additionalProperties: {},
            });
        });
    });

    describe($Tson.getDefinitionAtPath.name, () => {
        it('should return undefined for paths through bare objects', () => {
            const result = $Tson.getDefinitionAtPath($Tson.object(), 'name');

            expect(result).toBeUndefined();
        });

        it('should return undefined for paths through bare records', () => {
            const result = $Tson.getDefinitionAtPath($Tson.record(), 'name');

            expect(result).toBeUndefined();
        });
    });

    describe($Tson.resolveRefs.name, () => {
        it('should support bare object definitions', () => {
            const result = $Tson.resolveRefs($Tson.object(), () => undefined);

            expect(result).toEqual($Tson.object());
        });

        it('should support bare record definitions', () => {
            const result = $Tson.resolveRefs($Tson.record(), () => undefined);

            expect(result).toEqual($Tson.record());
        });
    });
});
