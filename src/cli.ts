#!/usr/bin/env node
import { createInterface } from "node:readline";
import { type NetlifyContext } from "./client";
import { NetlifyEnvManager } from "./NetlifyEnvManager";

async function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = "";
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    rl.on("line", (line) => (data += `${line}\n`));
    rl.on("close", () => resolve(data.trim()));
  });
}

export function parseContextsFromArgs(): NetlifyContext[] {
  const args = process.argv.slice(2);
  const contextArgIndex = args.findIndex((arg) => arg === "--context");

  if (contextArgIndex !== -1 && args.length > contextArgIndex + 1) {
    const contextArg = args[contextArgIndex + 1];
    // Validate context
    if (
      contextArg &&
      [
        "all",
        "dev",
        "branch-deploy",
        "deploy-preview",
        "production",
        "branch",
      ].includes(contextArg)
    ) {
      const context = contextArg as NetlifyContext;
      return [context];
    } else {
      console.warn(`Invalid context. Using defaults.`);
    }
  }

  return ["production", "deploy-preview", "branch-deploy"];
}

export async function main(): Promise<void> {
  try {
    const input = await readStdin();
    const config = JSON.parse(input);

    const contexts = parseContextsFromArgs();
    const manager = new NetlifyEnvManager(config, contexts);
    await manager.syncEnvironmentVariables(config);
  } catch (error) {
    console.error(
      "Error:",
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

// Self-executing block for when this is run directly as a script
// In ESM mode, we can't directly check if this is the main module like in CJS
// But we can execute the script directly
{
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}
