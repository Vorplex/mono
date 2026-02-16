export type Result<TValue, TFailure extends { reason: string }> = [null, TValue] | [TFailure, TValue];

export function ok<T>(value: T): Result<T, null> {
    return [null, value];
}

export function fail<TReason extends string, T extends { reason: TReason }>(error: T): Result<null, T> {
    return [error, null];
}
