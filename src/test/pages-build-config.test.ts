import { afterEach, describe, expect, it, vi } from "vitest";

// Inspect our options without starting Vite or a production build.
vi.mock("@lovable.dev/vite-tanstack-config", () => ({
  defineConfig: (options: unknown) => options,
}));

async function configFor(pages: boolean) {
  vi.resetModules();
  vi.stubEnv("GITHUB_PAGES", pages ? "true" : "false");
  const { default: config } = await import("../../vite.config");
  return config as unknown as {
    nitro?: { preset: string };
    tanstackStart: {
      spa?: { enabled: boolean };
      server?: { entry: string };
      prerender?: { autoStaticPathsDiscovery: boolean; crawlLinks: boolean };
    };
  };
}

afterEach(() => vi.unstubAllEnvs());

describe("Pages build configuration", () => {
  it("uses a render-capable CI entry instead of the broken static preset", async () => {
    const config = await configFor(true);
    expect(config.nitro?.preset).toBe("node-server");
    expect(config.tanstackStart.spa?.enabled).toBe(true);
  });

  it("generates only the SPA shell without discovering private pages", async () => {
    const config = await configFor(true);
    expect(config.tanstackStart.prerender?.autoStaticPathsDiscovery).toBe(false);
    expect(config.tanstackStart.prerender?.crawlLinks).toBe(false);
  });

  it("uses the standard server entry so the start page can be generated", async () => {
    expect((await configFor(true)).tanstackStart.server).toBeUndefined();
    expect((await configFor(false)).tanstackStart.server?.entry).toBe("server");
  });

  it("leaves normal hosting on the platform default", async () => {
    const config = await configFor(false);
    expect(config.nitro).toBeUndefined();
    expect(config.tanstackStart.spa).toBeUndefined();
  });
});