import { Awaitable } from '../../types/awaitable.type';

export class Context {

    public static create<T>(value?: T) {
        const stack = [value];
        function context(): T
        function context(value: T): Disposable & AsyncDisposable
        function context(factory: (current: T) => T): Disposable & AsyncDisposable
        function context<R>(value: T, callback: () => Awaitable<R>): Awaitable<R>
        function context<R>(factory: (current: T) => T, callback: () => Awaitable<R>): Awaitable<R>
        function context<R>(...args: [value?: T | ((current: T) => T), callback?: () => Awaitable<R>]): T | Awaitable<R> | Disposable | AsyncDisposable {
            if (args.length === 0) return stack[stack.length - 1];
            const next = typeof args[0] === 'function' ? (args[0] as (current: T) => T)(stack[stack.length - 1]) : args[0];
            stack.push(next);
            if (args.length === 1) {
                let disposed: boolean;
                const dispose = () => {
                    if (disposed) return;
                    disposed = true;
                    stack.pop();
                };
                return {
                    [Symbol.dispose]() { dispose(); },
                    async [Symbol.asyncDispose]() { dispose(); }
                };
            }
            try {
                const result = args[1]();
                if (result instanceof Promise) return result.finally(() => stack.pop());
                stack.pop();
                return result;
            } catch (error) {
                stack.pop();
                throw error;
            }
        }
        return context;
    }

    public static use<T>(callback: () => Promise<T>, ...contexts: (Disposable & AsyncDisposable)[]): Promise<T>
    public static use<T>(callback: () => T, ...contexts: (Disposable & AsyncDisposable)[]): T
    public static use<T>(callback: () => Awaitable<T>, ...contexts: (Disposable & AsyncDisposable)[]): Awaitable<T> {
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

}
