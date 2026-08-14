import { build } from "esbuild";

await build({
  entryPoints: ["./bootstrap/bootstrap.ts"],
  outfile: "./bootstrap/shtml.js",
  bundle: true,
  platform: "browser",
  format: "iife",
  target: "es2020",
  minify: true,
  sourcemap: false,
});

console.log("CDN bundle built: cdn/shtml.js");
