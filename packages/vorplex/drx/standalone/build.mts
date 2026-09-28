import { build, type BuildOptions } from "esbuild";
import { pathToFileURL } from "node:url";

export const builds = {
    drx: {
        entryPoints: ["./standalone/drx.ts"],
        outfile: "./dist/standalone/drx.js",
        bundle: true,
        platform: "browser",
        format: "iife",
        target: "es2020",
        minify: true,
        sourcemap: false,
    },
    runtime: {
        entryPoints: ["./standalone/runtime.ts"],
        outfile: "./dist/standalone/runtime.js",
        bundle: true,
        platform: "browser",
        format: "esm",
        target: "es2020",
        minify: true,
        sourcemap: false,
    },
    serviceWorker: {
        entryPoints: ["./standalone/pwa-service-worker.ts"],
        outfile: "./dist/standalone/pwa-service-worker.js",
        bundle: true,
        platform: "browser",
        format: "iife",
        target: "es2020",
        minify: true,
        sourcemap: false,
    }
} satisfies Record<string, BuildOptions>;

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    for (const options of Object.values(builds)) await build(options);
}
