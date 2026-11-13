# 🐼 Panda Workshop

*Little tools, curious experiments, and things I've made.*

**Live site:** <https://panoramicpanda.me>

Panda Workshop is a small, personal static-site publishing platform. Every folder in [`projects/`](projects/) is an independent web project that gets published at `https://panoramicpanda.me/projects/<folder-name>/` and listed automatically in a searchable gallery on the homepage.

- **Simple projects stay simple.** A folder with an `index.html` is a complete project.
- **Advanced projects are supported.** Vite + React apps can opt into their own build.
- **Discovery is automatic.** There is no project list to maintain.
- **Deployment is automatic.** Every push to `main` builds and deploys through GitHub Actions.
- **No backend.** Everything is static files on GitHub Pages.

---

## How to Publish a New Project

1. Create a folder inside `projects/` (lowercase letters, numbers and hyphens, e.g. `projects/my-tool/`).
2. Add an `index.html`.
3. Optionally add CSS, JavaScript, images, and a [`project.json`](#project-metadata-reference).
4. Commit and push to `main`.
5. GitHub Actions publishes the project at `https://panoramicpanda.me/projects/my-tool/` and adds it to the gallery and to the [Projects](#projects) list below.

Need a build step (React, etc.)? See [Adding a Vite + React project](#adding-a-vite--react-project).

---

## Contents

- [Architecture](#architecture)
- [Repository layout](#repository-layout)
- [Local installation](#local-installation)
- [Development commands](#development-commands)
- [Adding a basic HTML project](#adding-a-basic-html-project)
- [Adding an HTML/CSS/JS project](#adding-an-htmlcssjs-project)
- [Adding a Vite + React project](#adding-a-vite--react-project)
- [Project metadata reference](#project-metadata-reference)
- [Automatic discovery](#automatic-discovery)
- [Build process](#build-process)
- [GitHub Pages deployment](#github-pages-deployment)
- [Troubleshooting](#troubleshooting)
- [Security considerations](#security-considerations)
- [Projects](#projects)

---

## Architecture

```text
 projects/<slug>/ ──► discover-projects ──► src/generated/projects.json ──► Vite + React homepage
        │                                                                        │
        │                  build-projects                                        ▼
        └──────────► (copy static files / npm ci + build) ──────────► dist/projects/<slug>/
                                                                                 │
                                    validate-dist ◄──────────────────────────────┘
                                          │
                                          ▼
                     GitHub Actions ──► upload dist/ ──► GitHub Pages (panoramicpanda.me)
```

- **The homepage** (`src/`) is a Vite + React app. It reads a catalog generated at build time, so it never calls GitHub's API or any server at runtime.
- **Projects** live in `projects/`, *not* in `public/`. Vite copies `public/` wholesale, which could leak source and config files. A dedicated build script decides exactly what gets published.
- **The homepage and the projects are independent.** Each project is served as its own page at `/projects/<slug>/`. The homepage's React bundle is never loaded into a project.

## Repository layout

```text
panda-workshop/
├── .github/workflows/deploy.yml   # build, test, deploy, README refresh
├── projects/                      # one folder per published project
│   └── <slug>/
│       ├── index.html             # required
│       └── project.json           # optional metadata
├── scripts/
│   ├── lib/                       # shared, unit-tested logic
│   │   ├── paths.mjs              #   slug & path safety
│   │   ├── metadata.mjs           #   project.json validation + defaults
│   │   ├── discover.mjs           #   project discovery + catalog
│   │   ├── copy.mjs               #   safe static copy (exclusions, no symlinks)
│   │   ├── build.mjs              #   npm ci + build for built projects
│   │   └── readme.mjs             #   README "Projects" section
│   ├── discover-projects.mjs      # writes src/generated/projects.json
│   ├── build-projects.mjs         # publishes projects into dist/projects/
│   ├── build-project.mjs          # builds a single project
│   ├── validate-dist.mjs          # final checks on dist/
│   ├── update-readme.mjs          # refreshes the Projects list below
│   └── vite-plugin-projects.mjs   # dev server: serves projects, live catalog refresh
├── src/                           # homepage (React)
│   ├── components/
│   ├── lib/search.js
│   ├── generated/projects.json    # generated, git-ignored
│   ├── App.jsx
│   ├── main.jsx
│   └── styles.css
├── public/favicon.svg
├── tests/                         # node:test unit tests
├── index.html
├── vite.config.js
└── package.json
```

## Local installation

Requires **Node.js 20+** (CI uses Node 22 LTS).

```bash
git clone https://github.com/PanoramicPanda/panda-workshop.git
```

```bash
cd panda-workshop
```

```bash
npm install
```

## Development commands

| Command | What it does |
|---|---|
| `npm run dev` | Discovers projects, then starts the homepage dev server. Projects are served at `/projects/<slug>/`, and adding, removing or editing a project folder or `project.json` refreshes the gallery live. |
| `npm run build` | Full production build into `dist/`: discover → build homepage → copy static projects → build React projects → validate output → refresh the README project list. |
| `npm run preview` | Serves the finished `dist/` locally so you can check the homepage and every project exactly as they'll be deployed. Run `npm run build` first. |
| `npm test` | Runs the unit tests (discovery, metadata validation, path safety, copying, README generation, search). |
| `npm run build:project -- <slug>` | Builds one built project in place (into its own output folder) with the correct base path. `npm run dev` then serves that output. |
| `npm run discover` | Regenerates `src/generated/projects.json` only. |
| `npm run readme` | Regenerates the [Projects](#projects) section of this README only. |

## Adding a basic HTML project

```text
projects/my-tool/
└── index.html
```

That's all it takes. With no metadata, the gallery shows it as **My Tool** in the **Other** category with a generated placeholder thumbnail.

## Adding an HTML/CSS/JS project

```text
projects/calculator/
├── index.html
├── style.css
├── script.js
├── thumbnail.png
├── images/
│   └── icon.png
└── project.json
```

- Files are copied byte-for-byte, keeping the folder structure, so **relative paths** (`style.css`, `images/icon.png`) just work.
- Avoid root-absolute paths like `/style.css`. They resolve against `panoramicpanda.me/`, not your project folder.
- `project.json` adds a name, description, category, tags and a thumbnail. It isn't published itself.

## Adding a Vite + React project

Built projects must **explicitly opt in**. Having a `package.json` is not enough.

```text
projects/react-dashboard/
├── index.html
├── package.json
├── package-lock.json      # required — CI uses `npm ci`
├── vite.config.js
├── project.json
└── src/
    ├── main.jsx
    └── App.jsx
```

**`project.json`:**

```json
{
  "name": "React Dashboard",
  "description": "An interactive dashboard built with React.",
  "category": "Experiments",
  "tags": ["React", "Dashboard"],
  "build": {
    "enabled": true,
    "command": "npm run build",
    "output": "dist"
  }
}
```

**`vite.config.js`:** use the base path the pipeline provides:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Set by Panda Workshop to /projects/<slug>/ during builds.
  base: process.env.PROJECT_BASE_PATH ?? '/',
  plugins: [react()],
});
```

Then create the lockfile once from inside the project folder:

```bash
npm install
```

What happens on build:

1. `npm ci` installs the project's own dependencies (separately from the homepage).
2. The configured `command` runs with `PROJECT_BASE_PATH=/projects/<slug>/` set.
3. The `output` folder is checked for an `index.html`.
4. **Only the compiled output** is copied to `dist/projects/<slug>/`. Source files, `node_modules`, and config are never published.
5. If anything fails, the whole deployment fails. Broken projects are never skipped silently.

For day-to-day work on a React project, run its own dev server from its folder (`npm run dev` inside `projects/<slug>/`).

### Client-side routing

GitHub Pages is a static file host. It can't rewrite `/projects/my-app/settings` back to `/projects/my-app/index.html`, so refreshing or deep-linking into a nested route with `BrowserRouter` will 404.

For apps that need routes, use **hash routing** (`HashRouter` in React Router, `createHashRouter`), which gives URLs like `/projects/my-app/#/settings`. These always load `index.html` and work everywhere.

## Project metadata reference

`project.json` is optional for static projects. Every field is optional.

| Field | Type | Default | Notes |
|---|---|---|---|
| `name` | string | Folder name in Title Case | Shown on the card. Max 80 chars. |
| `description` | string | "A small project from the workshop." | Max 500 chars. |
| `category` | string | `Other` | Used by the category filter. |
| `tags` | string[] | `[]` | Searchable; duplicates removed. |
| `featured` | boolean | `false` | Shown in the **Featured** section and listed first. |
| `hidden` | boolean | `false` | Left out of the gallery and README, but **still published and reachable by URL**. |
| `thumbnail` | string | Generated placeholder | Relative path to an image inside the project (`.png .jpg .jpeg .gif .webp .svg .avif`). A 16:9 image looks best. |
| `build.enabled` | boolean | `false` | Opts the project into a build step. |
| `build.command` | string | `npm run build` | Run inside the project folder. |
| `build.output` | string | `dist` | Relative folder containing the built site. |

Unknown fields, wrong types, absolute paths, URLs and `..` segments are rejected with a descriptive error. URLs can't be set in metadata; they always come from the folder name.

## Automatic discovery

`scripts/discover-projects.mjs` runs before every dev session and build. It:

1. Scans the **immediate** child folders of `projects/`. Dot-folders and stray files are ignored.
2. Validates each folder name (the URL slug): lowercase letters, numbers and single hyphens, 1–64 characters. `assets` and `thumbnails` are reserved.
3. Requires an `index.html` (empty placeholder folders are skipped).
4. Reads and validates `project.json`, filling in defaults.
5. Writes the public catalog (hidden projects removed, featured first) to `src/generated/projects.json`.

All problems are reported together, and any problem stops the build. The catalog is generated, so it's git-ignored and never edited by hand.

## Build process

`npm run build` runs:

1. **`discover-projects.mjs`** builds the catalog.
2. **`vite build`** builds the homepage into `dist/`. The folder is emptied first, so removed projects never linger.
3. **`build-projects.mjs`** publishes each project into `dist/projects/<slug>/`:
   - *static*: safe copy of the project folder
   - *build*: `npm ci`, the build command, then a copy of only the output folder

   It also copies thumbnails into `dist/thumbnails/`.
4. **`validate-dist.mjs`** checks that every catalog URL has a published `index.html`, there are no stale or unexpected project folders, and no forbidden files (`.env`, `node_modules`, `package.json`, keys…) or React source files made it into the output.
5. **`update-readme.mjs`** refreshes the [Projects](#projects) section of this README.

Output:

```text
dist/
├── index.html
├── assets/              # homepage bundle
├── favicon.svg
├── thumbnails/<slug>.png
└── projects/
    └── <slug>/index.html …
```

## GitHub Pages deployment

The workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) runs on every push to `main` and can also be started manually (**Actions → Deploy to GitHub Pages → Run workflow**).

| Job | Permissions | What it does |
|---|---|---|
| `build` | `contents: read` | `npm ci`, `npm test`, `npm run build`, then uploads `dist/` as the Pages artifact. |
| `deploy` | `pages: write`, `id-token: write` | Deploys the artifact to the `github-pages` environment with `actions/deploy-pages`. |
| `readme` | `contents: write` | After a successful build, regenerates the Projects list in this README and commits it as `github-actions[bot]` if it changed. |

- GitHub Pages serves the **compiled `dist/` artifact**, not the repository files. No `gh-pages` branch is needed.
- Repository **Settings → Pages → Source** must be **GitHub Actions**.
- Deployments are serialized (`concurrency: pages`).
- There's no `pull_request` trigger, so unreviewed code never runs with deploy credentials.
- The custom domain `panoramicpanda.me` is configured in the repository's Pages settings and at DNS. No `CNAME` file is needed with Actions-based deployments. The homepage uses root-relative paths for the custom domain, so the temporary `*.github.io/panda-workshop/` URL won't render correctly. Use the custom domain.
- The README bot commit is pushed with `GITHUB_TOKEN`, which by design doesn't trigger another workflow run. Running `npm run build` locally before pushing usually leaves the bot with nothing to do.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Project discovery found N problems` | Read the listed messages. Typical causes: an uppercase or space in a folder name, a missing `index.html`, a JSON syntax error in `project.json`, or a `thumbnail` that doesn't exist. |
| Project page loads but CSS/JS/images 404 | Use relative paths (`style.css`, `./img/a.png`), not `/style.css`. For built projects, make sure `vite.config.js` sets `base: process.env.PROJECT_BASE_PATH`. |
| `built projects need a committed package-lock.json` | Run `npm install` inside the project folder and commit the lockfile. |
| Built project shows "hasn't been built yet" in `npm run dev` | Run `npm run build:project -- <slug>`, or use the project's own `npm run dev`. |
| React route 404s after refresh | Switch to hash routing (see [Client-side routing](#client-side-routing)). |
| A file is missing from the published project | It may match an exclusion (`.env*`, `*.key`, `*.pem`, `package.json`, `project.json`, `node_modules`, `.git`, `*.log`…) or be a symlink. Symlinks are never followed. |
| Workflow succeeds but the site doesn't change | Check **Settings → Pages → Source** is "GitHub Actions" and the `deploy` job ran. Browsers may cache for a few minutes. |
| `readme` job fails to push | Branch protection on `main` is probably blocking `github-actions[bot]`. Allow it, or run `npm run readme` locally and commit. The site deploy is unaffected. |

## Security considerations

- **No backend, no database, no secrets.** Everything published is public. Never put API keys or credentials in a project. Client-side code can't keep a secret.
- **Safe publishing.** Static copies skip `.env*`, `.git`, `node_modules`, `*.pem`/`*.key`/SSH keys, `.npmrc`, package and lock files, metadata, logs and caches. Symlinks are never followed, and every path is checked to stay inside its project folder. Built projects publish only their output folder.
- **Validated slugs and paths.** Folder names, thumbnails and build output paths are validated against traversal (`..`), absolute paths and URLs.
- **Shared origin.** Every project is served from `panoramicpanda.me`, so they all share one browser origin. Separate folders do **not** isolate JavaScript: any project can read another's `localStorage`, `IndexedDB`, cookies and service workers on this domain. Only publish code (and npm dependencies) you trust, and namespace your storage keys (e.g. `my-tool:settings`).
- **Build execution.** Built projects run their own npm scripts in CI. Only enable `build` for code you've reviewed. Workflows run only for pushes to `main` and manual runs, never for pull requests.
- **Minimal CI permissions.** Read-only by default. Only the deploy job gets Pages/OIDC permissions, and only the README job can write repository contents.

---

## Projects

This list is generated from each project's metadata by `npm run build` and kept up to date by CI. Don't edit it by hand.

<!-- PROJECTS:START — generated by scripts/update-readme.mjs; do not edit by hand -->

### Hunter Pet Training Guide

A WoW Forever hunter pet guide for every family: which pets to tame and where, for each ability rank, with leveling plans, attack speeds, and Wowhead links.

- **Live:** <https://panoramicpanda.me/projects/hunter-pet-guide/>
- **Source:** [`projects/hunter-pet-guide/`](projects/hunter-pet-guide/)
- **Category:** Gaming
- **Type:** Static HTML
- **Tags:** `WoW`, `Hunter`, `Pets`, `Guide`, `WoW Forever`

### MCU Release Order Chart

An interactive MCU timeline from Iron Man to VisionQuest in release order, with season buckets for shows interrupted by films, spoiler-redacted connections between titles, an MCU Adjacent toggle (Fox X-Men, Spider-Men, Netflix shows, Agents of S.H.I.E.L.D.), and Disney+'s official Doomsday watchlist marked and filterable.

- **Live:** <https://panoramicpanda.me/projects/mcu-release-order/>
- **Source:** [`projects/mcu-release-order/`](projects/mcu-release-order/)
- **Category:** Entertainment
- **Type:** Static HTML
- **Tags:** `MCU`, `Marvel`, `Timeline`, `Release Order`, `Doomsday`

<!-- PROJECTS:END -->
