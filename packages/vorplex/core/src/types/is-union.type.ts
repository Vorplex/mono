export type IsUnion<T, U = T> = T extends any ? ([U] extends [T] ? false : true) : false;
