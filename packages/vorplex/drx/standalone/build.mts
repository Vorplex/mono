import { build } from "esbuild";
import { mkdir, readFile, writeFile } from "fs/promises";

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
    format: "esm",
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

const runtime = await readFile("./standalone/cdn/runtime.js", "utf8");
const serviceWorker = await readFile("./standalone/cdn/pwa-service-worker.js", "utf8");
await mkdir("./src/out", { recursive: true });
await writeFile("./src/out/assets.ts", `export const RUNTIME_JS = ${JSON.stringify(runtime)};\nexport const PWA_SERVICE_WORKER_JS = ${JSON.stringify(serviceWorker)};\n`);
