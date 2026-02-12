export type CamelToKebab<T extends string> = T extends `${infer a}-${infer b1}${infer b2}-${infer c1}${infer c2}-${infer d1}${infer d2}`
    ? `${Lowercase<a>}${Uppercase<b1>}${Lowercase<b2>}${Uppercase<c1>}${Lowercase<c2>}${Uppercase<d1>}${Lowercase<d2>}`
    : T extends `${infer a}-${infer b1}${infer b2}-${infer c1}${infer c2}`
      ? `${Lowercase<a>}${Uppercase<b1>}${Lowercase<b2>}${Uppercase<c1>}${Lowercase<c2>}`
      : T extends `${infer a}-${infer b1}${infer b2}`
        ? `${Lowercase<a>}${Uppercase<b1>}${Lowercase<b2>}`
        : T;
