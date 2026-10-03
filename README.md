# OnTimely Web

The website for [OnTimely](https://github.com/masalaempire/OnTimely), a simple macOS app that helps you start tasks and finish before their deadlines.

White and blue, system fonts, an interactive app preview, features, about, FAQ, download links, and GitHub support. The preview is explicitly an example and saves no tasks. There are no analytics scripts or external font services.

## Connect to Cloudflare Workers

In the Cloudflare dashboard, create a **Worker** using **Import a repository**, then select **masalaempire/OnTimelyWeb**.

| Setting | Value |
| --- | --- |
| Worker name | `ontimely-web` |
| Production branch | `main` |
| Root directory | Repository root (leave blank) |
| Build command | `npm run build` |
| Deploy command | `npx wrangler@4 deploy` |
| Non-production deploy command, if shown | `npx wrangler@4 versions upload` |

The Worker name must match `name` in [wrangler.jsonc](./wrangler.jsonc). Change both together if you choose a different name.

The build uses Node.js 20.11+ (Node 22 recommended), without framework dependencies. It copies `public/` to `dist/`, fetches the actual app logo from a pinned app commit, and makes the published images local to the website. The package's install hook also creates `dist/` if Cloudflare runs its install step before deployment. Static assets are configured in Wrangler; there is no Pages output-directory setting to fill in.

After the first deployment, open the Workers URL. Add your domain under **Settings → Domains & Routes** when ready.

Official guides: [GitHub integration](https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/github-integration/) · [Static assets configuration](https://developers.cloudflare.com/workers/static-assets/binding/).

## Downloads and releases

Both download buttons use the stable [latest DMG](https://github.com/masalaempire/OnTimely/releases/latest/download/OnTimely.dmg) URL. The release label updates from GitHub's public API. If that request fails or is rate limited, the label falls back to “Latest on GitHub” and the download continues to work.

Future app releases should keep the asset name `OnTimely.dmg`. If the packaging name changes, update the download URLs and asset-name check in `public/site.js`.

## Website files

- `public/index.html` — website content and the clearly labeled interactive preview
- `public/styles.css` — responsive white and blue design
- `public/site.js` — preview interactions, keyboard tabs, and release metadata
- `public/404.html` — custom missing-page screen
- `scripts/build.mjs` — prepares assets for Cloudflare
- `wrangler.jsonc` — Cloudflare Workers deployment configuration

The app logo is reused from the app's `Design/OnTimely-icon-master.png`, matching its blue clock icon. Source pages reference the pinned GitHub image; deployed pages serve their own copy.

## Checks

GitHub Actions builds the site, checks the Cloudflare deployment package, and runs Chromium checks at desktop and mobile sizes. The checks cover preview actions, keyboard navigation, FAQ expansion, release API failure, image loading, download URLs, and page overflow. Screenshots and the test report are attached to each run as **website-preview**.

The source can also be viewed through a GitHub raw-file HTML preview service. The authoritative live website is the Cloudflare Worker after you connect this repository.
