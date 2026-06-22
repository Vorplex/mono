declare const IdentifierSymbol: unique symbol;

type IdentifierPart = string | number | boolean;

export type Identifier<TShape> = string & {
    readonly [IdentifierSymbol]: TShape;
};

export function createIdentifier<TShape extends Record<string, IdentifierPart>>() {
    return (value: TShape): Identifier<TShape> => {
        return Object.values(value).join(':') as Identifier<TShape>;
    };
}
