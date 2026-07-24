import { Awaitable } from '../../types/awaitable.type';

export class Context {

    public static create<T>(value?: T) {
        const stack = [value];
        function context<R>(): T
        function context<R>(value: T): Disposable & AsyncDisposable
        function context<R>(value: T, callback: () => Awaitable<R>): Awaitable<R>
        function context<R>(...args: [value?: T, callback?: () => Awaitable<R>]): T | Awaitable<R> | Disposable | AsyncDisposable {
            if (args.length === 0) return stack[stack.length - 1];
            stack.push(args[0]);
            if (args.length === 1) {
                return {
                    [Symbol.dispose]() { stack.pop(); },
                    async [Symbol.asyncDispose]() { stack.pop(); }
                };
            }
            try {
                return args[1]();
            } finally {
                stack.pop();
            }
        }
        return context;
    }

}
