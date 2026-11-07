// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const pages = process.env["GITHUB_PAGES"] === "true";
const pagesBase = process.env["PAGES_BASE_PATH"] || "/";

export default defineConfig({
  ...(pages ? {
    vite: { base: pagesBase, define: { "import.meta.env.VITE_GITHUB_PAGES": JSON.stringify("true") } },
    nitro: { preset: "static" },
  } : {}),
  tanstackStart: {
    ...(pages ? { spa: { enabled: true }, prerender: { enabled: true, crawlLinks: false } } : {}),
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
