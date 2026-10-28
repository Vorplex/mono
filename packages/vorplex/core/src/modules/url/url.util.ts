export class $Url {

    public static isAbsolute(url: string): boolean {
        return /^[a-z][a-z0-9+.-]*:/i.test(url ?? '');
    }

    public static resolve(url: string, path: string): string {
        try {
            const source = new URL(url);
            const target = new URL(path, source);
            if (target.origin === source.origin && !target.search) target.search = source.search;
            return target.href;
        } catch {
            return path;
        }
    }

}
