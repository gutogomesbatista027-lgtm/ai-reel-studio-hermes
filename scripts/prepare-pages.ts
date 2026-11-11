import { cp, mkdir, readFile, writeFile, access } from "node:fs/promises";
import { resolve } from "node:path";

// CI packaging only; never imported into the application runtime.
let publicDir: string | undefined;
for (const candidate of [".output/public", "dist/client"]) {
  try {
    await access(resolve(candidate, "_shell.html"));
    publicDir = candidate;
    break;
  } catch { /* Try the next supported output location. */ }
}
if (!publicDir) throw new Error("Static SPA shell not found; deployment stopped.");
const shell = await readFile(resolve(publicDir, "_shell.html"), "utf8");
if (shell.length < 200 || !shell.includes("<script") || /Internal Server Error/i.test(shell)) {
  throw new Error("Start page is empty or an error page; deployment stopped.");
}
await mkdir("dist-pages", { recursive: true });
await cp(publicDir, "dist-pages", { recursive: true });
await writeFile("dist-pages/index.html", await readFile(resolve(publicDir, "_shell.html"), "utf8"));
await mkdir("dist-pages/auth", { recursive: true });
await writeFile("dist-pages/auth/index.html", await readFile(resolve(publicDir, "_shell.html"), "utf8"));
await writeFile("dist-pages/.nojekyll", "");
console.log("Prepared static Pages files; server output is excluded.");