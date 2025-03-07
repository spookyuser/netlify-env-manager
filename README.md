# Netlify Environment Manager

A utility library for managing Netlify environment variables across different contexts such as production, deploy-preview, and branch-deploy.

## Installation

```bash
# Using npm
npm install netlify-env-manager

# Using yarn
yarn add netlify-env-manager

# Using pnpm
pnpm add netlify-env-manager

# Using bun
bun add netlify-env-manager
```

## Usage

### As a Library

```typescript
import { NetlifyEnvManager } from 'netlify-env-manager';

// Configure with your Netlify credentials
const config = {
  NETLIFY_ACCOUNT_ID: 'your-account-id',
  NETLIFY_AUTH_TOKEN: 'your-auth-token',
  NETLIFY_SITE_ID: 'your-site-id', // optional
  
  // Any additional key-value pairs will be synchronized as environment variables
  API_KEY: 'your-api-key',
  DATABASE_URL: 'your-database-url'
};

// Create a manager instance, optionally specifying contexts
const manager = new NetlifyEnvManager(config, ['production', 'deploy-preview']);

// Sync environment variables (deletes existing and creates new variables)
await manager.syncEnvironmentVariables(config);

// Or use individual operations
await manager.deleteExistingEnvVars();
await manager.createEnvVars(config);
```

### As a CLI Tool

This library can also be used as a CLI tool when installed globally:

```bash
echo '{"NETLIFY_ACCOUNT_ID": "your-account-id", "NETLIFY_AUTH_TOKEN": "your-auth-token", "MY_ENV_VAR": "value"}' | netlify-env-manager
```

Specify a specific context:

```bash
echo '{"NETLIFY_ACCOUNT_ID": "your-account-id", "NETLIFY_AUTH_TOKEN": "your-auth-token", "MY_ENV_VAR": "value"}' | netlify-env-manager --context production
```

## API

### `NetlifyEnvManager`

The main class for managing Netlify environment variables.

#### Constructor

```typescript
constructor(config: Record<string, unknown>, contexts: ContextType[] = ["production", "deploy-preview", "branch-deploy"])
```

- `config`: Object containing Netlify credentials and any additional environment variables
- `contexts`: Array of contexts to manage (defaults to production, deploy-preview, and branch-deploy)

#### Methods

- `getEnvVarsByContext(context?: ContextType)`: Get environment variables for a specific context
- `deleteEnvVar(key: string)`: Delete an environment variable by key
- `deleteExistingEnvVars()`: Delete all existing non-protected environment variables
- `createEnvVars(envVars: EnvVar[] | Record<string, unknown>)`: Create environment variables
- `syncEnvironmentVariables(config: Record<string, unknown>)`: Sync all environment variables

## Development

### OpenAPI Type Generation

This library uses [openapi-typescript](https://github.com/drwpow/openapi-typescript) to generate TypeScript types from Netlify's OpenAPI specification. The types are generated automatically when:

1. You run `npm install` or `bun install` (via the `postinstall` script)
2. You run `npm run generate-types` or `bun run generate-types`
3. Before publishing (via the `prepublishOnly` script)

The types are generated directly in the `node_modules/.netlify-types` directory and are not committed to the repository.

## License

MIT
