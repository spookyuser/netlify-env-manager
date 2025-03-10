import pLimit from "p-limit";
import * as v from "valibot";
import {
  ConfigSchema,
  type Config,
  NetlifyClient,
  type NetlifyContext,
  type NetlifyEnvVar,
} from "./client";

export class NetlifyEnvManager {
  private readonly PROTECTED_ENV_VARS = [
    "NETLIFY_ACCOUNT_ID",
    "NETLIFY_AUTH_TOKEN",
    "NETLIFY_SITE_ID",
    "SECRETS_SCAN_ENABLED",
  ];
  private readonly CONCURRENCY_LIMIT = 5;

  private client: NetlifyClient;
  private contexts: NetlifyContext[];

  constructor(
    config: Record<string, unknown>,
    contexts: NetlifyContext[] = [
      "production",
      "deploy-preview",
      "branch-deploy",
    ]
  ) {
    const { NETLIFY_ACCOUNT_ID, NETLIFY_AUTH_TOKEN, NETLIFY_SITE_ID } =
      this.validateConfig(config);

    this.client = new NetlifyClient({
      accountId: NETLIFY_ACCOUNT_ID,
      authToken: NETLIFY_AUTH_TOKEN,
      siteId: NETLIFY_SITE_ID,
    });

    this.contexts = contexts;
    console.log(`Using contexts: ${this.contexts.join(", ")}`);
  }

  private validateConfig(config: Record<string, unknown>): Config {
    try {
      return v.parse(ConfigSchema, config);
    } catch (error) {
      if (error instanceof v.ValiError) {
        const issues = error.issues
          .map((issue) => `- ${issue.path.join(".")}: ${issue.message}`)
          .join("\n");
        throw new Error(`Validation failed:\n${issues}`);
      }
      throw error;
    }
  }

  async getEnvVarsByContext(
    context?: NetlifyContext
  ): Promise<NetlifyEnvVar[]> {
    return this.client.getEnvVars(context);
  }

  async deleteEnvVar(key: string): Promise<void> {
    return this.client.deleteEnvVar(key);
  }

  async deleteExistingEnvVars(): Promise<void> {
    const varsToDelete = [];

    for (const context of this.contexts) {
      console.log(`Fetching variables for context: ${context}...`);
      const contextVars = await this.getEnvVarsByContext(context);

      const filteredVars = contextVars.filter(
        (env) => !this.PROTECTED_ENV_VARS.includes(env.key)
      );
      varsToDelete.push(...filteredVars);
    }

    const uniqueKeys = [...new Set(varsToDelete.map((v) => v.key))];

    console.log(
      `Deleting ${
        uniqueKeys.length
      } variables from contexts [${this.contexts.join(", ")}]...`
    );

    if (uniqueKeys.length === 0) return;

    const limit = pLimit(this.CONCURRENCY_LIMIT);
    await Promise.all(
      uniqueKeys.map((key) =>
        limit(() =>
          this.deleteEnvVar(key)
            .then(() => console.log(`Deleted: ${key}`))
            .catch((err) => console.error(`Failed to delete ${key}:`, err))
        )
      )
    );
  }

  async createEnvVars(
    envVars: NetlifyEnvVar[] | Record<string, unknown>
  ): Promise<void> {
    const varsArray = !Array.isArray(envVars)
      ? this.createEnvVarsFromConfig(envVars)
      : envVars;

    if (varsArray.length === 0) return;

    console.log(`Creating ${varsArray.length} environment variables...`);
    await this.client.createEnvVars(varsArray);
  }

  createEnvVarsFromConfig(config: Record<string, unknown>): NetlifyEnvVar[] {
    return Object.entries(config)
      .filter(([key]) => !this.PROTECTED_ENV_VARS.includes(key))
      .map(
        ([key, value]): NetlifyEnvVar => ({
          key,
          values: this.contexts.map((context) => ({
            value: String(value),
            context,
          })),
          is_secret: true,
          scopes: ["builds", "functions", "runtime"],
        })
      );
  }

  async syncEnvironmentVariables(
    config: Record<string, unknown>
  ): Promise<void> {
    console.log(
      `Syncing variables for contexts: [${this.contexts.join(", ")}]...`
    );
    await this.deleteExistingEnvVars();
    await this.createEnvVars(config);
  }
}
