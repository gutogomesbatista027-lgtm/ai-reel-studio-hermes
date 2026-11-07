import { describe, expect, it } from "vitest";
import { pagesBasePath, pagesRpcUrl, trustedPagesOrigin } from "./pages-hosting";

describe("GitHub Pages hosting", () => {
  it("keeps repository paths separate from application routes", () => {
    expect(pagesBasePath("/reel-studio/")).toBe("/reel-studio");
    expect(pagesBasePath("/")).toBe("/");
  });
  it("permits only the configured HTTPS Pages origin", () => {
    expect(trustedPagesOrigin("https://creator.github.io", "https://creator.github.io")).toBe(true);
    expect(trustedPagesOrigin("https://other.github.io", "https://creator.github.io")).toBe(false);
    expect(trustedPagesOrigin("https://creator.github.io.attacker.test", "https://creator.github.io")).toBe(false);
    expect(trustedPagesOrigin("http://creator.github.io", "http://creator.github.io")).toBe(false);
    expect(trustedPagesOrigin("https://creator.github.io", undefined)).toBe(false);
  });
  it("keeps the generated RPC path and query on the trusted server", () => {
    expect(pagesRpcUrl("/reel-studio/_serverFn/abc?x=1", "https://studio.example", "/reel-studio/").href)
      .toBe("https://studio.example/_serverFn/abc?x=1");
    expect(pagesRpcUrl("https://attacker.test/_serverFn/abc", "https://studio.example", "/").origin)
      .toBe("https://studio.example");
    expect(() => pagesRpcUrl("/_serverFn/abc", "http://studio.example", "/")).toThrow();
  });
});