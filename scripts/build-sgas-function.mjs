import { createRequire } from "node:module";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, ".."),
  require = createRequire(resolve(root, "web/package.json"));
const { build } = require("esbuild");
const directory = resolve(root, "supabase/functions/sgas-experience");
const assets = {
  regular:
    "web/node_modules/@fontsource/noto-sans/files/noto-sans-latin-400-normal.woff",
  bold: "web/node_modules/@fontsource/noto-sans/files/noto-sans-latin-700-normal.woff",
  logo: "web/public/glf-logo.png",
};
await writeFile(
  resolve(directory, "assets.ts"),
  (
    await Promise.all(
      Object.entries(assets).map(
        async ([key, path]) =>
          `export const ${key} = ${JSON.stringify((await readFile(resolve(root, path))).toString("base64"))};`,
      ),
    )
  ).join("\n") + "\n",
);
const versions = {
  zod: "4.6.5",
  "pdf-lib": "1.17.1",
  "@pdf-lib/fontkit": "1.1.1",
  "@supabase/supabase-js": "2.117.2",
};
await build({
  absWorkingDir: root,
  entryPoints: [resolve(directory, "source.ts")],
  outfile: resolve(directory, "index.ts"),
  bundle: true,
  format: "esm",
  platform: "neutral",
  target: "es2022",
  plugins: [
    {
      name: "deno-pinned-dependencies",
      setup(b) {
        b.onResolve(
          {
            filter: /^(zod|pdf-lib|@pdf-lib\/fontkit|@supabase\/supabase-js)$/,
          },
          (args) => ({
            path: `npm:${args.path}@${versions[args.path]}`,
            external: true,
          }),
        );
      },
    },
  ],
  banner: {
    js: "// Generated from source.ts and shared web model/PDF renderer; do not edit manually.",
  },
});
console.log(
  "Built authenticated SGAS function with embedded GLF assets and pinned dependencies.",
);
