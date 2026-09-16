import { build } from "esbuild";

await build({
    entryPoints: ["./standalone/drx.ts"],
    outfile: "./dist/standalone/drx.js",
    bundle: true,
    platform: "browser",
    format: "iife",
    target: "es2020",
    minify: true,
    sourcemap: false,
});

await build({
    entryPoints: ["./standalone/runtime.ts"],
    outfile: "./dist/standalone/runtime.js",
    bundle: true,
    platform: "browser",
    format: "esm",
    target: "es2020",
    minify: true,
    sourcemap: false,
});

await build({
    entryPoints: ["./standalone/pwa-service-worker.ts"],
    outfile: "./dist/standalone/pwa-service-worker.js",
    bundle: true,
    platform: "browser",
    format: "iife",
    target: "es2020",
    minify: true,
    sourcemap: false,
});
