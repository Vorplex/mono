import { MimeType } from '@vorplex/core';
import fs from 'fs';
import { OutgoingHttpHeader, OutgoingHttpHeaders, ServerResponse } from 'http';
import path from 'path';
import { HttpResponseCodes } from './response-codes.enum';

export class $HttpResponder {

    public static setCookie(response: ServerResponse, name: string, value: string, options: { expiresInSeconds?: number, path?: string, domain?: string, httpsOnly?: boolean, hidden?: boolean, sameSite?: 'Strict' | 'Lax' | 'None' } = {}) {
        if (response.headersSent) return;
        let existing = response.getHeader('Set-Cookie') || [];
        let attributes = '';
        attributes += `Path=${options.path ?? '/'}; `;
        if (options.expiresInSeconds != null) attributes += `Max-Age=${options.expiresInSeconds}; `;
        if (options.domain != null) attributes += `Domain=${options.domain}; `;
        if (options.httpsOnly || options.sameSite === 'None') attributes += `Secure; `;
        if (options.hidden) attributes += `HttpOnly; `;
        if (options.sameSite != null) attributes += `SameSite=${options.sameSite}; `;
        const header = `${name}=${value}; ${attributes}`;
        if (Array.isArray(existing)) existing = existing.concat(header);
        else existing = [existing as string, header];
        response.setHeader('Set-Cookie', existing);
    }

    public static json(
        response: ServerResponse,
        options: {
            statusCode?: HttpResponseCodes;
            statusText?: string;
            headers?: OutgoingHttpHeaders | OutgoingHttpHeader[];
            value: any;
        },
    ) {
        if (response.headersSent) return;
        response
            .setHeader('Content-Type', MimeType.json)
            .writeHead(options.statusCode ?? (options.value === undefined ? HttpResponseCodes.NoContent : HttpResponseCodes.OK), options.statusText, options.headers)
            .end(options.value === undefined ? undefined : JSON.stringify(options.value));
    }

    public static file(
        response: ServerResponse,
        options: {
            statusCode?: HttpResponseCodes;
            statusText?: string;
            headers?: OutgoingHttpHeaders | OutgoingHttpHeader[];
            filePath: string;
        },
    ): Promise<void> {
        if (response.headersSent) return;
        return new Promise((resolve, reject) => {
            response
                .setHeader('Content-Type', MimeType[path.extname(options.filePath).split('.').pop()] || '')
                .writeHead(options.statusCode ?? HttpResponseCodes.OK, options.statusText, options.headers);
            response.once('finish', () => resolve());
            response.once('error', (error) => reject(error));
            fs.createReadStream(options.filePath).pipe(response, { end: true });
        });
    }

    public static html(
        response: ServerResponse,
        options: {
            statusCode?: HttpResponseCodes;
            statusText?: string;
            headers?: OutgoingHttpHeaders | OutgoingHttpHeader[];
            html: string;
        },
    ) {
        if (response.headersSent) return;
        response
            .setHeader('Content-Type', MimeType.html)
            .writeHead(options.statusCode ?? HttpResponseCodes.OK, options.statusText, options.headers)
            .end(`<!DOCTYPE html>\n${options.html}`);
    }

    public static internalServerError(
        response: ServerResponse,
        options: {
            statusCode?: HttpResponseCodes;
            statusText?: string;
            headers?: OutgoingHttpHeaders | OutgoingHttpHeader[];
        } = {},
    ) {
        if (response.headersSent) return;
        response
            .writeHead(options.statusCode ?? HttpResponseCodes.InternalServerError, options.statusText, options.headers)
            .end();
    }

    public static ok(response: ServerResponse) {
        if (!response.headersSent) {
            response.end();
        }
    }

    public static redirect(response: ServerResponse, url: string) {
        if (!response.headersSent) {
            response.statusCode = 302;
            response.setHeader('Location', url);
            response.end();
        }
    }
}
