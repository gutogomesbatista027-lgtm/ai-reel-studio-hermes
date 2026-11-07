/** Only the static Pages build opts into a repository base and hash history. */
export function pagesBasePath(base: string): string {
  return `/${base.split("/").filter(Boolean).join("/")}`;
}

export function trustedPagesOrigin(origin: string | null, configured: string | undefined): boolean {
  if (!origin || !configured) return false;
  try {
    const allowed = new URL(configured);
    return allowed.protocol === "https:" && allowed.origin === configured && origin === allowed.origin;
  } catch {
    return false;
  }
}

/** Preserve the generated RPC path and protocol; never send tokens to a supplied request host. */
export function pagesRpcUrl(input: string, apiOrigin: string, basePath: string): URL {
  const api = new URL(apiOrigin);
  if (api.protocol !== "https:") throw new Error("O endereço do servidor precisa usar HTTPS.");
  const source = new URL(input, api.origin);
  const base = pagesBasePath(basePath);
  const pathname = base !== "/" && source.pathname.startsWith(`${base}/`)
    ? source.pathname.slice(base.length)
    : source.pathname;
  return new URL(pathname + source.search, api.origin);
}