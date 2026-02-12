export type KeysWithFix<TObject, TPrefix, TSuffix> = {
    [k in keyof TObject as `${TPrefix & string}${k & string}${TSuffix & string}`]: TObject[k];
};
