import type { BuildConfig } from "bun";
import { $ } from "bun";
import dts from "bun-plugin-dts";

const defaultBuildConfig: BuildConfig = {
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
};

// CLI build config
const cliBuildConfig: BuildConfig = {
  entrypoints: ["./src/cli.ts"],
  outdir: "./dist",
  naming: "cli.js",
};

await Promise.all([
  // Library builds
  Bun.build({
    ...defaultBuildConfig,
    plugins: [dts()],
    format: "esm",
    naming: "[dir]/[name].js",
  }),
  Bun.build({
    ...defaultBuildConfig,
    format: "cjs",
    naming: "[dir]/[name].cjs",
  }),

  // CLI build
  Bun.build({
    ...cliBuildConfig,
    format: "esm",
  }),
]);

// Make the CLI executable
$`chmod +x ./dist/cli.js`;
