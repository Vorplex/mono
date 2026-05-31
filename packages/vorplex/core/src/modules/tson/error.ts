import type { TsonSchema } from './schema';

export class TsonError extends Error {
    constructor(
        public message: string,
        public value: any,
        public schema: TsonSchema,
        public path: string = '',
    ) {
        super(message);
    }
}

export type TsonResult<T> = [value: T | undefined, errors: TsonError[]];
