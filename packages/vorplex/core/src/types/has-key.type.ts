export type HasKey<T, K extends PropertyKey> = T extends { [P in K]: unknown } ? true : false;
