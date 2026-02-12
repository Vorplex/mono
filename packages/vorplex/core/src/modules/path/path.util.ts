export class $Path {
    public static isAbsolute(path: string): boolean {
        return path.startsWith('/') || path.startsWith('\\');
    }

    public static relative(path: string): string {
        return `./${$Path.absolute(path)}`;
    }

    public static absolute(path: string): string {
        return $Path.join(path);
    }

    public static join(...paths: string[]): string {
        const separator = '/';
        const path = paths.join(separator);
        const protocol = path.match(/^([a-zA-Z][a-zA-Z0-9+.-]*:\/\/\/?)/)?.[1] ?? '';
        return (
            protocol +
            path
                .substring(protocol.length)
                .split(/[/\\]+/)
                .reduce<string[]>((stack, segment) => {
                    if (segment === '' || segment === '.') return stack;
                    if (segment === '..') stack.pop();
                    else stack.push(segment);
                    return stack;
                }, [])
                .join(separator)
        );
    }

    public static getDirectory(path: string): string {
        const index = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
        if (index > -1) return path.substring(0, index);
        return path;
    }

    public static entryName(path: string): string {
        const index = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
        return path.substring(index + 1);
    }

    public static fileName(path: string): string | null {
        const name = $Path.entryName(path);
        return name.includes('.') ? name : null;
    }

    public static getExtension(path: string): string | null {
        const indexes = {
            slash: Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\')),
            dot: path.lastIndexOf('.'),
        };
        return indexes.dot > -1 && indexes.dot > indexes.slash ? path.substring(indexes.dot).toLowerCase() : null;
    }

    public static setExtension(path: string, extension: string): string {
        extension = extension.startsWith('.') ? extension : '.' + extension;
        const indexes = {
            slash: Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\')),
            dot: path.lastIndexOf('.'),
        };
        return indexes.dot > indexes.slash ? path.slice(0, indexes.dot) + extension : path + extension;
    }
}
