# AI Reel Studio Hermes

Implement exactly the screenshot and nothing else

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c2ff861e-5f72-4ee3-b8b5-f8f996a1ff44).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## GitHub Pages

Pages serves interactive screens using the current Cloud database and accounts.
The published Lovable app runs authenticated job actions and webhook endpoints.
No worker credentials or server bundle are uploaded to Pages.

### Required setup

1. Publish in Lovable; keep the published server and Pages on matching source
   versions so generated server-function IDs match.
2. GitHub **Settings → Pages → Build and deployment**: select **GitHub Actions**.
3. GitHub **Settings → Secrets and variables → Actions → Variables**: add
   `SERVER_ORIGIN` with the published Lovable HTTPS origin, without a path.
   The current public Cloud configuration remains in the project environment.
   Never add service-role keys or worker secrets to the Pages build.
4. Set the Lovable server secret `GITHUB_PAGES_ORIGIN` to the exact Pages origin
   (for example `https://your-account.github.io`, without a repository path),
   then publish again. Only that origin receives cross-origin RPC access.
5. **More → Users → Auth settings → Advanced → Redirect URLs**: add the Pages
   address ending in `/**` for email confirmation.
6. GitHub **Actions → Publish AI Reel Studio to GitHub Pages → Run workflow**.
   It also runs on pushes to `main`; adapt that filter for another synced branch.

Pages links use TanStack hash history: `https://your-account.github.io/repo/#/dashboard`.
This supports refresh without a 404 rewrite. Lovable URLs are unchanged.
The build uploads only static files. Git sync alone does not activate Pages;
the GitHub Actions result must confirm deployment before the address is live.
Media processing still requires the external worker to be configured.
