import createClient from "openapi-fetch";
import * as v from "valibot";
import type {
  components,
  paths,
} from "../node_modules/.netlify-types/netlify-api";

export type NetlifyContext = components["schemas"]["envVarValue"]["context"];
export type NetlifyEnvVarValue = components["schemas"]["envVarValue"];

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

export const ConfigSchema = v.object({
  NETLIFY_ACCOUNT_ID: v.string(),
  NETLIFY_AUTH_TOKEN: v.string(),
  NETLIFY_SITE_ID: v.string(),
});

export type Config = v.InferOutput<typeof ConfigSchema>;

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
