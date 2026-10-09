export interface Debounced<T extends any[]> {
    (...args: T): void;
    cancel(): void;
    flush(): void;
}

export function debounce<T extends any[]>(ms: number, action: (...args: T) => unknown): Debounced<T> {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let pending: T | undefined;
    const clear = () => {
        clearTimeout(timeout);
        timeout = undefined;
        pending = undefined;
    };
    const flush = () => {
        if (!pending) return;
        const args = pending;
        clear();
        action(...args);
    };
    return Object.assign((...args: T) => {
        pending = args;
        clearTimeout(timeout);
        timeout = setTimeout(flush, ms);
    }, { cancel: clear, flush });
}
