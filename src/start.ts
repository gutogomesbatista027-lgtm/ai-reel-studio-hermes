import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";
import { pagesServerFetch } from "./lib/pages-fetch";
import { trustedPagesOrigin } from "./lib/pages-hosting";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Start installs this automatically when src/start.ts is absent; defining the
// file opts out, so re-add it explicitly to keep server functions protected
// from cross-site requests.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
  origin: (origin, ctx) => origin === new URL(ctx.request.url).origin ||
    trustedPagesOrigin(origin, process.env["GITHUB_PAGES_ORIGIN"]),
  secFetchSite: (site, ctx) => site === "same-origin" ||
    (site === "cross-site" && trustedPagesOrigin(ctx.request.headers.get("origin"), process.env["GITHUB_PAGES_ORIGIN"])),
});

const pagesCorsMiddleware = createMiddleware().server(async ({ request, next }) => {
  const origin = request.headers.get("origin");
  if (!trustedPagesOrigin(origin, process.env["GITHUB_PAGES_ORIGIN"])) return next();
  const headers = new Headers({
    "Access-Control-Allow-Origin": origin ?? "",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept, X-TSS-Serialized, X-TSS-Raw, X-TSR-Redirect",
    Vary: "Origin",
  });
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  const result = await next();
  const response = result.response;
  headers.forEach((value, key) => {
    if (key === "vary") response.headers.append(key, value);
    else response.headers.set(key, value);
  });
  return result;
});

export const startInstance = createStart(() => ({
  serverFns: { fetch: pagesServerFetch },
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [pagesCorsMiddleware, errorMiddleware, csrfMiddleware],
}));
