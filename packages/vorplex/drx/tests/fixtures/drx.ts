import { test as base, expect, type Locator, type Page } from '@playwright/test';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const wasm = createRequire(resolve(import.meta.dirname, '../../../compiler/package.json')).resolve('esbuild-wasm/esbuild.wasm');

const icons = ['chevron-down', 'chevron-up'];
const sprite = `<svg xmlns="http://www.w3.org/2000/svg">${icons.map(name => `<symbol id="${name}" viewBox="0 0 24 24"><path data-icon="${name}" d="M6 9l6 6 6-6"></path></symbol>`).join('')}</svg>`;

export type DrxNode = Locator & {
    readonly expect: ReturnType<typeof expect<Locator>>;
};

export interface DrxRenderOptions {
    files?: Record<string, string>;
    hash?: string;
}

export class DrxFixture {
    public readonly logs: string[] = [];
    public readonly errors: string[] = [];
    private files: Record<string, string> = {};

    constructor(public readonly page: Page) { }

    public async install(): Promise<void> {
        this.page.on('console', message => {
            if (message.type() !== 'error') this.logs.push(message.text());
            else if (!message.text().startsWith('Failed to load resource')) this.errors.push(message.text());
        });
        this.page.on('pageerror', error => this.errors.push(error.message));
        await this.page.route('**/lucide-static/sprite.svg', route => route.fulfill({ contentType: 'image/svg+xml', body: sprite }));
        await this.page.route('**/esbuild-wasm@*/esbuild.wasm', route => route.fulfill({ contentType: 'application/wasm', path: wasm }));
        await this.page.route('**/tests/app/**', route => {
            const path = new URL(route.request().url()).pathname.slice('/tests/app/'.length);
            if (path in this.files) return route.fulfill({ contentType: path.endsWith('.html') ? 'text/html' : 'text/plain', body: this.files[path] });
            return route.fulfill({ status: 404 });
        });
    }

    public async render(source: string, options: DrxRenderOptions = {}): Promise<void> {
        this.files = {
            ...options.files,
            'index.html': `<script src="/packages/vorplex/drx/dist/standalone/drx.js"></script>\n${source}`
        };
        await this.page.goto(`/tests/app/index.html${options.hash ?? ''}`);
    }

    public node(id: string): DrxNode {
        const locator = this.page.locator(`#${id}`);
        return Object.defineProperty(locator, 'expect', { get: () => expect(locator) }) as DrxNode;
    }

    public async navigate(hash: string): Promise<void> {
        await this.page.evaluate(hash => { location.hash = hash; }, hash);
    }

    public async logged(text: string): Promise<void> {
        await expect.poll(() => this.logs).toContain(text);
    }
}

export const test = base.extend<{ drx: DrxFixture }>({
    drx: async ({ page }, use) => {
        const drx = new DrxFixture(page);
        await drx.install();
        await use(drx);
    }
});

export { expect };
