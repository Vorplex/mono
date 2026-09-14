import { build } from "esbuild";

await build({
    entryPoints: ["./standalone/drx.ts"],
    outfile: "./standalone/cdn/drx.js",
    bundle: true,
    platform: "browser",
    format: "iife",
    target: "es2020",
    minify: true,
    sourcemap: false,
});

await build({
    entryPoints: ["./standalone/runtime.ts"],
    outfile: "./standalone/cdn/runtime.js",
    bundle: true,
    platform: "browser",
    format: "iife",
    target: "es2020",
    minify: true,
    sourcemap: false,
});

await build({
    entryPoints: ["./standalone/pwa-service-worker.ts"],
    outfile: "./standalone/cdn/pwa-service-worker.js",
    bundle: true,
    platform: "browser",
    format: "iife",
    target: "es2020",
    minify: true,
    sourcemap: false,
});

console.log("CDN bundles built: standalone/cdn/drx.js, standalone/cdn/runtime.js, standalone/cdn/pwa-service-worker.js");
