type RouteParamObject<P extends string> =
    P extends `...${infer Name}?` ? { [K in Name]?: string }
    : P extends `...${infer Name}` ? { [K in Name]: string }
    : P extends `${infer Name}?` ? { [K in Name]?: string }
    : { [K in P]: string };

export type ExtractRouteParams<T extends string> =
    T extends `${string}{${infer P}}${infer Rest}` ? RouteParamObject<P> & ExtractRouteParams<Rest>
    : {};

export interface RouteParameter {
    name: string;
    optional: boolean;
    rest: boolean;
}

export class $Router {
    /**
     *
     * @param route
     * `/api/users/get/{name}/{surname?}`
     *
     * `/api/users/?`
     *
     * `/api/users/get/{...rest}`
     * @param url
     * @returns
     */
    public static match(route: string, url: string): Record<string, string> {
        const regex = $Router.getRouteRegex(route);
        const result = regex.exec(url.trim().split(/[?#]/, 1)[0]);
        if (!result) return null;
        return result.groups ?? {};
    }

    public static getParameters(route: string): RouteParameter[] {
        const pattern = [
            // check if the parameter starts with ...
            '(?<rest>[.]{3})?',
            // extract the name from the parameter
            '(?<name>[^?}]*)',
            // check if the parameter ends with a ?
            '(?<optional>[?])?',
        ];
        const regex = new RegExp(`({${pattern.join('')}})`, 'gmi');
        let match: RegExpExecArray;
        const variables: { name: string; optional: boolean; rest: boolean }[] = [];
        while ((match = regex.exec(route))) {
            variables.push({
                name: match.groups['name'],
                rest: match.groups['rest'] === '...',
                optional: match.groups['optional'] === '?',
            });
        }
        return variables;
    }

    public static getRouteRegex(route: string): RegExp {
        const variables = $Router.getParameters(route);
        for (const variable of variables) {
            if (variable.rest) {
                route = route.replace(`{...${variable.name}}`, `(?<${variable.name}>(?:.*))`);
            } else if (variable.optional) {
                route = route.replace(`{${variable.name}?}`, `(?<${variable.name}>(?:[^/]+)?)`);
            } else {
                route = route.replace(`{${variable.name}}`, `(?<${variable.name}>(?:[^/]+))`);
            }
        }
        return new RegExp(`^${route}$`, 'gmi');
    }

    public static getQueryParameters(url: string): Record<string, string> {
        return Object.fromEntries(new URL(url, 'http://domain').searchParams);
    }
}
