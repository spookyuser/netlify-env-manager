import createClient from "openapi-fetch";
import { z } from "zod";
import type { components, paths } from "./types";

// Extract and export types from the OpenAPI spec
export type NetlifyContext = components["schemas"]["envVarValue"]["context"];
export type NetlifyEnvVarValue = components["schemas"]["envVarValue"];

// Define interfaces for our API types
export interface NetlifyEnvVar {
  key: string;
  values: NetlifyEnvVarValue[];
  scopes?: Array<"builds" | "functions" | "runtime" | "post-processing">;
  is_secret?: boolean;
}

export interface NetlifyClientConfig {
  accountId: string;
  authToken: string;
  siteId?: string;
}

// Zod schema for config validation
export const ConfigSchema = z
  .object({
    NETLIFY_ACCOUNT_ID: z.string().min(1, "NETLIFY_ACCOUNT_ID is required"),
    NETLIFY_AUTH_TOKEN: z.string().min(1, "NETLIFY_AUTH_TOKEN is required"),
    NETLIFY_SITE_ID: z.string().optional(),
  })
  .passthrough(); // Allow additional properties that will become environment variables

// Typed config interface derived from Zod schema
export type Config = z.infer<typeof ConfigSchema>;

/**
 * Netlify API client for managing environment variables
 */
export class NetlifyClient {
  private client: ReturnType<typeof createClient<paths>>;
  private accountId: string;
  private siteId?: string;

  constructor({ accountId, authToken, siteId }: NetlifyClientConfig) {
    this.accountId = accountId;
    this.siteId = siteId;

    this.client = createClient<paths>({
      baseUrl: "https://api.netlify.com/api/v1",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });
  }

  async getEnvVars(context?: NetlifyContext) {
    const params: Record<string, string> = {};
    if (this.siteId) params.site_id = this.siteId;
    if (context) params.context_name = context;

    const { data, error } = await this.client.GET(
      "/accounts/{account_id}/env",
      {
        params: {
          path: { account_id: this.accountId },
          query: params,
        },
      }
    );

    if (error)
      throw new Error(
        `Failed to get environment variables: ${JSON.stringify(error)}`
      );
    return data as NetlifyEnvVar[];
  }

  async deleteEnvVar(key: string) {
    const params: Record<string, string> = {};
    if (this.siteId) params.site_id = this.siteId;

    const { error } = await this.client.DELETE(
      "/accounts/{account_id}/env/{key}",
      {
        params: {
          path: {
            account_id: this.accountId,
            key,
          },
          query: params,
        },
      }
    );

    if (error)
      throw new Error(
        `Failed to delete environment variable: ${JSON.stringify(error)}`
      );
  }

  async createEnvVars(envVars: NetlifyEnvVar[]) {
    const params: Record<string, string> = {};
    if (this.siteId) params.site_id = this.siteId;

    const { error } = await this.client.POST("/accounts/{account_id}/env", {
      params: {
        path: { account_id: this.accountId },
        query: params,
      },
      body: envVars,
    });

    if (error)
      throw new Error(
        `Failed to create environment variables: ${JSON.stringify(error)}`
      );
  }
}
