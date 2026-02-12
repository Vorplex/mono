export const HttpRequestMethod = {
    Get: 'GET',
    Post: 'POST',
    Put: 'PUT',
    Delete: 'DELETE',
    Connect: 'CONNECT',
    Options: 'OPTIONS',
    Trace: 'TRACE',
    Patch: 'PATCH'
} as const;

export type HttpRequestMethod = typeof HttpRequestMethod[keyof typeof HttpRequestMethod];
