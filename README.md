# Netlify Environment Manager

A utility library for managing Netlify environment variables across different contexts such as production, deploy-preview, and branch-deploy.

## Usage

### As a Library

```typescript
import { NetlifyEnvManager } from "@spookyuser/netlify-env-manager";

// Configure with your Netlify credentials
const config = {
  NETLIFY_ACCOUNT_ID: "your-account-id",
  NETLIFY_AUTH_TOKEN: "your-auth-token",
  NETLIFY_SITE_ID: "your-site-id", // optional

  // Any additional key-value pairs will be synchronized as environment variables
  API_KEY: "your-api-key",
  DATABASE_URL: "your-database-url",
};

// Create a manager instance, optionally specifying contexts
const manager = new NetlifyEnvManager(config, ["production", "deploy-preview"]);

// Sync environment variables (deletes existing and creates new variables)
await manager.syncEnvironmentVariables(config);

// Or use individual operations
await manager.deleteExistingEnvVars();
await manager.createEnvVars(config);
```

I use it with dotenvx like this:

```ts
import { config } from "@dotenvx/dotenvx";
import {
  NetlifyClientConfig,
  NetlifyEnvManager,
} from "@spookyuser/netlify-env-manager";

const prodVariables = config({
  path: ["../../.env", "../../.env.prod"],
  overload: true,
});

if (!prodVariables.parsed) {
  throw new Error("No environment variables found");
}

new NetlifyEnvManager(prodVariables.parsed, [
  "production",
]).syncEnvironmentVariables(prodVariables.parsed);
```

## License

MIT
