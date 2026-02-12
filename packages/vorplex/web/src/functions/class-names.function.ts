export function classNames(...classes: (string | Record<string, boolean>)[]) {
    let className = '';
    for (const item of classes) {
        if (typeof item === 'string') {
            className = `${className} ${item}`.trim();
        } else {
            for (const key in item) {
                className = `${className} ${item[key] ? key : ''}`.trim();
            }
        }
    }
    return className;
}
