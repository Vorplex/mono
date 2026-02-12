import { $String } from '@vorplex/core';
import { HttpResponseCodes } from './response-codes.enum';

export class HttpError extends Error {

    constructor(public code: HttpResponseCodes, message?: string) {
        super($String.isNullOrEmpty(message) ? Object.entries(HttpResponseCodes).find(([key, value]) => value === code)?.[0] ?? String(`HTTP ${code}`) : message);
    }

}

export class WebError extends Error {

    constructor(message: string, public data?: any) {
        super(message);
    }

}
