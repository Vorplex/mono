
import { IncomingMessage } from 'http';
import { HttpError } from './error.model';
import { HttpResponseCodes } from './response-codes.enum';

export class $HttpReader {

    public static getCookies(request: IncomingMessage) {
        const header = request.headers.cookie || '';
        const cookies: Record<string, string> = {};
        for (let cookie of header.split(';')) {
            cookie = cookie.trim();
            if (!cookie) continue;
            const index = cookie.indexOf('=');
            if (index < 0) continue;
            const key = cookie.substring(0, index).trim();
            const value = cookie.substring(index + 1);
            cookies[key] = decodeURIComponent(value);
        }
        return cookies;
    }

    public static async readJson<T = any>(request: IncomingMessage): Promise<T> {
        return new Promise((resolve, reject) => {
            let data = '';
            request.on('data', chunk => data += chunk);
            request.on('end', () => {
                if (!data) return resolve(null as T);
                try {
                    resolve(JSON.parse(data));
                } catch {
                    reject(new HttpError(HttpResponseCodes.BadRequest, 'Invalid JSON'));
                }
            });
            request.on('error', reject);
        });
    }

}
