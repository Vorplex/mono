export const HttpResponseCodes = {
    OK: 200,
    NoContent: 204,
    PartialContent: 206,
    Redirect: 302,
    BadRequest: 400,
    Unauthorized: 401,
    Forbidden: 403,
    NotFound: 404,
    MethodNotAllowed: 405,
    UnsupportedMediaType: 415,
    Locked: 423,
    InternalServerError: 500,
    NotImplemented: 501
} as const;
export type HttpResponseCodes = typeof HttpResponseCodes[keyof typeof HttpResponseCodes];
