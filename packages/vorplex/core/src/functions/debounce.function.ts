export function debounce<T extends any[], TResult>(ms: number, action: (...args: T) => TResult): (...args: T) => void {
    let timeout: number;
    const delay = () =>
        setTimeout(() => {
            clearTimeout(timeout);
            timeout = null;
        }, ms);
    return (...args) => {
        if (!timeout) action(...args);
        delay();
    };
}
