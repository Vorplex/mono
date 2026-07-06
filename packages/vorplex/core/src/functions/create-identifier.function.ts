declare const IdentifierSymbol: unique symbol;

type IdentifierPartConstructor = StringConstructor | NumberConstructor | BooleanConstructor;

type ShapeFromSchema<TSchema extends Record<string, IdentifierPartConstructor>> = {
    [K in keyof TSchema]:
    TSchema[K] extends StringConstructor ? string
    : TSchema[K] extends NumberConstructor ? number
    : boolean;
};

export type Identifier<TShape> = string & {
    readonly [IdentifierSymbol]: TShape;
};

export function createIdentifier<TSchema extends Record<string, IdentifierPartConstructor>>(schema: TSchema) {
    type TShape = ShapeFromSchema<TSchema>;
    const keys = Object.keys(schema) as (keyof TShape & string)[];
    function id(value: Identifier<TShape>): TShape;
    function id(value: TShape): Identifier<TShape>;
    function id(value: TShape | Identifier<TShape>): Identifier<TShape> | TShape {
        if (typeof value === 'string') {
            const parts = value.split(':').map(decodeURIComponent);
            return keys.reduce((shape, key, index) => {
                const ctor = schema[key];
                shape[key] = (ctor === Boolean ? parts[index] === 'true' : ctor(parts[index])) as TShape[typeof key];
                return shape;
            }, {} as TShape);
        }
        return keys.map((key) => encodeURIComponent(String(value[key]))).join(':') as Identifier<TShape>;
    }
    return id;
}
