import { context } from "esbuild";
import { resolve } from "node:path";
import { builds } from "./build.mts";

const root = resolve(import.meta.dirname, "../../../..");
const drx = await context({ ...builds.drx, absWorkingDir: resolve(import.meta.dirname, "..") });
await drx.watch();
const { port } = await drx.serve({ servedir: root, ...(process.env.PORT && { port: Number(process.env.PORT) }) });
console.log(`DRX docs (local runtime): http://localhost:${port}/docs/drx/?drx=/packages/vorplex/drx/dist/standalone/drx.js`);
