export function parseUrl(url: string) {
    const match = url.match(/^(.*):\/\/(([^:/?#]*)(?::([0-9]+))?)[/]{0,1}([^?#]*)\??([^#]*|)(#.*|)$/);
    const getParameters = (search: string) => {
        const result: Record<string, string> = {};
        if (search) {
            const params = new URLSearchParams(search);
            params.forEach((value, key) => {
                result[key] = value;
            });
        }
        return result;
    };
    return (
        match && {
            href: url,
            domain: `${match[1]}://${match[2]}`,
            protocol: match[1],
            host: match[2],
            hostname: match[3],
            port: Number(match[4]) || null,
            path: match[5],
            search: match[6],
            hash: match[7],
            parameters: getParameters(match[6]),
        }
    );
}
