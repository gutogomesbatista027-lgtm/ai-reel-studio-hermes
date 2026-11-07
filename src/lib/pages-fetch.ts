import { pagesRpcUrl } from "./pages-hosting";

export const pagesServerFetch: typeof fetch = (input, init) => {
  const apiOrigin = import.meta.env.VITE_SERVER_ORIGIN;
  if (import.meta.env.VITE_GITHUB_PAGES !== "true" || !apiOrigin) return fetch(input, init);
  const source = input instanceof Request ? input.url : String(input);
  const url = pagesRpcUrl(source, apiOrigin, import.meta.env.BASE_URL);
  if (input instanceof Request) {
    return fetch(new Request(url, input), { ...init, credentials: "omit" });
  }
  return fetch(url, { ...init, credentials: "omit" });
};