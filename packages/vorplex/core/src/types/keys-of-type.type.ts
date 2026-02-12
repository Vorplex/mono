export type KeysOfType<TObject, TType> = {
    [k in {
        [k in keyof TObject]: TObject[k] extends TType ? k : never;
    }[keyof TObject]]: TType;
};
