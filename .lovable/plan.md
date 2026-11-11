# Fix the GitHub Pages build for good

## What went wrong
The log shows the app code itself built fine. It broke in the final step that creates the start page (`index.html`):
- The temporary server used for that step crashed (`server.fetch is not a function`), so the start page came back with an error (500) and **0 pages** were created.
- The error did not stop the job, so GitHub left it running for about 6 hours until it was cancelled.

Cause: in the Pages build, the app's custom error-handling server wrapper is used together with the Node server mode, and the start-page generator can't call it.

## Fix
1. **Pages build uses the standard server entry.** Turn off the custom server wrapper only for GitHub Pages builds. Normal Lovable hosting keeps it. This is the part that crashed.
2. **Stop endless runs.** Give the GitHub job a time limit (15 minutes per step, 20 for the whole job) so a failure ends in minutes, not hours.
3. **Check the result before uploading.** After the build, the packaging script stops with a clear message if the start page is missing or is an error page. Nothing broken gets published.
4. **Test it here first.** Run the exact GitHub Pages build in this workspace with the same settings (repository subpath `/ai-reel-studio-hermes/`), confirm `index.html` is created, and open it in a browser to check the login screen loads. I'll only tell you to run it again on GitHub after this passes.
5. Add a test that checks the Pages build doesn't use the custom wrapper and still generates the start page, and keep the current tests passing.

## Technical details
- `vite.config.ts`: `server: { entry: "server" }` only when `GITHUB_PAGES !== "true"`.
- `.github/workflows/github-pages.yml`: `timeout-minutes` on the build job and on the build step.
- `scripts/prepare-pages.ts`: check `_shell.html` exists, is not empty, and contains the app script; exit non-zero otherwise.
- If the local build still fails after step 1, fall back to generating `index.html` from the client build manifest without a prerender server.
- `src/test/pages-build-config.test.ts`: assert there's no custom server entry in Pages mode.

## What you'll need to do afterward
Wait for the code to sync to GitHub, then run **Actions → Run workflow** again. Once it's online, send me the Pages address so I can allow processing from it.
