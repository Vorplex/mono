export class $WindowShare {

    public static share(win: Window, key: string, value: any) {
        win['shared'] ??= {};
        win['shared'][key] = value;
    }

    public static get<T = any>(key: string): T {
        return window['shared']?.[key];
    }

}