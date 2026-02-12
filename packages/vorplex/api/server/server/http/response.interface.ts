import { MimeType } from '@vorplex/core';
import { HttpResponseCodes } from './response-codes.enum';

export interface HttpResponse {
    type?: string;
    code?: HttpResponseCodes;
    status?: string;
    headers?: Record<string, string>;
}

export interface HttpJsonResponse<T = any> extends HttpResponse {
    type: 'json';
    value: T;
}

export interface HttpFileResponse extends HttpResponse {
    type: 'file';
    file: string;
    mimeType: MimeType;
}

export interface HttpRedirectResponse extends HttpResponse {
    type: 'redirect';
    url: string;
    code?: HttpResponseCodes;
}

export type HttpResponses = HttpJsonResponse | HttpFileResponse | HttpRedirectResponse;


