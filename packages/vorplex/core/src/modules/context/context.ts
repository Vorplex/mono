import { Awaitable } from '../../types/awaitable.type';

export type Context<T> = {
    (): T;
    (value: T): Disposable & AsyncDisposable & { value: T };
    (factory: (current: T) => T): Disposable & AsyncDisposable & { value: T };
    <R>(value: T, callback: (value: T) => Awaitable<R>): Awaitable<R>;
    <R>(factory: (current: T) => T, callback: (value: T) => Awaitable<R>): Awaitable<R>;
};

function create<T = any>(value?: T): Context<T> {
    const stack = [value];
    return <R>(...args: [value?: T | ((current: T) => T), callback?: (value: T) => Awaitable<R>]): T | Awaitable<R> | (Disposable & AsyncDisposable & { value: T }) => {
        if (args.length === 0) return stack[stack.length - 1];
        const value = typeof args[0] === 'function' ? (args[0] as (current: T) => T)(stack[stack.length - 1]) : args[0];
        stack.push(value);
        if (args.length === 1) {
            let disposed: boolean;
            const dispose = () => {
                if (disposed) return;
                disposed = true;
                stack.pop();
            };
            return {
                value: value,
                [Symbol.dispose]() { dispose(); },
                async [Symbol.asyncDispose]() { dispose(); }
            };
        }
        try {
            const result = args[1](value);
            if (result instanceof Promise) return result.finally(() => stack.pop());
            stack.pop();
            return result;
        } catch (error) {
            stack.pop();
            throw error;
        }
    };
}

function use<T>(callback: () => Promise<T>, ...contexts: (Disposable & AsyncDisposable)[]): Promise<T>
function use<T>(callback: () => T, ...contexts: (Disposable & AsyncDisposable)[]): T
function use<T>(callback: () => Awaitable<T>, ...contexts: (Disposable & AsyncDisposable)[]): Awaitable<T> {
    const stack = new DisposableStack();
    contexts.forEach(context => stack.use(context));
    try {
        const result = callback();
        if (result instanceof Promise) return result.finally(() => stack.dispose());
        stack.dispose();
        return result;
    } catch (error) {
        stack.dispose();
        throw error;
    }
}

export const Context = {
    create,
    use
};