import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import { NetlifyEnvManager } from "../src/NetlifyEnvManager";

mock.module("../src/client", () => ({
  NetlifyClient: class MockNetlifyClient {
    constructor() {}
    async getEnvVars() {
      return [];
    }
    async deleteEnvVar() {
      return;
    }
    async createEnvVars() {
      return;
    }
  },
}));

describe("NetlifyEnvManager", () => {
  let consoleSpy: any;

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("should create an instance with default contexts", () => {
    const config = {
      NETLIFY_ACCOUNT_ID: "test-account",
      NETLIFY_AUTH_TOKEN: "test-token",
    };

    const manager = new NetlifyEnvManager(config);
    expect(manager).toBeDefined();
  });

  it("should throw an error for invalid config", () => {
    const config = {
      // Missing required fields
    };

    expect(() => new NetlifyEnvManager(config as any)).toThrow();
  });
});
