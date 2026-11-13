// Vite plugin for local development:
//  - serves projects/<slug>/ at /projects/<slug>/ (static projects as-is; built projects from
//    their build output folder, after `npm run build:project -- <slug>`)
//  - serves thumbnails at /thumbnails/<slug>.<ext>
//  - watches projects/ and regenerates src/generated/projects.json so the gallery refreshes live
import fs from 'node:fs';
import path from 'node:path';
import { PROJECTS_DIR, isInside, slugProblem } from './lib/paths.mjs';
import { discoverProjects, thumbnailPublicPath } from './lib/discover.mjs';
import { writeCatalog } from './lib/catalog.mjs';
import { isExcluded } from './lib/copy.mjs';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.wasm': 'application/wasm',
  '.pdf': 'application/pdf',
};

function safeProjects(logger) {
  try {
    return discoverProjects();
  } catch (err) {
    logger?.error(err.message);
    return [];
  }
}

function sendFile(res, file) {
  res.statusCode = 200;
  res.setHeader('Content-Type', MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream');
  res.setHeader('Cache-Control', 'no-store');
  fs.createReadStream(file).pipe(res);
}

function sendHtml(res, status, title, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(
    `<!doctype html><meta charset="utf-8"><title>${title}</title>` +
      `<body style="font:16px/1.5 system-ui;max-width:40rem;margin:4rem auto;padding:0 1rem">` +
      `<h1>${title}</h1>${body}<p><a href="/">← Back to Panda Workshop</a></p></body>`,
  );
}

/** Resolves a URL path inside `baseDir`, refusing traversal, excluded names and symlinks. */
function resolveSafe(baseDir, urlPath) {
  const parts = urlPath.split('/').filter(Boolean);
  if (parts.some((p) => p === '..' || p === '.' || isExcluded(p))) return null;
  let file = path.join(baseDir, ...parts);
  if (!isInside(baseDir, file)) return null;
  if (fs.existsSync(file) && fs.lstatSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) return null;
  // Reject symlinks anywhere along the path.
  let cursor = file;
  while (isInside(baseDir, cursor) && cursor !== path.resolve(baseDir)) {
    if (fs.lstatSync(cursor).isSymbolicLink()) return null;
    cursor = path.dirname(cursor);
  }
  return fs.lstatSync(file).isFile() ? file : null;
}

function projectsMiddleware(logger) {
  return (req, res, next) => {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    } catch {
      return next();
    }

    const thumb = pathname.match(/^\/thumbnails\/([^/]+)$/);
    if (thumb) {
      const project = safeProjects(logger).find((p) => thumbnailPublicPath(p) === pathname);
      if (!project) return next();
      return sendFile(res, path.join(project.dir, project.thumbnail));
    }

    const match = pathname.match(/^\/projects\/([^/]+)(\/.*)?$/);
    if (!match) return next();
    const [, slug, rest] = match;
    if (slugProblem(slug)) return sendHtml(res, 404, 'Project not found', `<p>No project at <code>/projects/${slug}/</code>.</p>`);
    if (!rest) {
      res.statusCode = 301;
      res.setHeader('Location', `/projects/${slug}/`);
      return res.end();
    }

    const project = safeProjects(logger).find((p) => p.slug === slug);
    if (!project) {
      return sendHtml(res, 404, 'Project not found', `<p>There is no valid project in <code>projects/${slug}/</code>. Check the terminal for discovery errors.</p>`);
    }

    let baseDir = project.dir;
    if (project.mode === 'build') {
      baseDir = path.join(project.dir, project.build.output);
      if (!fs.existsSync(path.join(baseDir, 'index.html'))) {
        return sendHtml(
          res,
          503,
          `${project.name} hasn't been built yet`,
          `<p>This is a built project. Build it once, then refresh:</p><pre>npm run build:project -- ${slug}</pre>` +
            `<p>Or run its own dev server from <code>projects/${slug}/</code> with <code>npm run dev</code>.</p>`,
        );
      }
    }

    const file = resolveSafe(baseDir, rest);
    if (!file) return sendHtml(res, 404, 'Not found', `<p><code>${pathname}</code> doesn't exist in this project.</p>`);
    return sendFile(res, file);
  };
}

export function pandaProjects() {
  return {
    name: 'panda-workshop-projects',

    configureServer(server) {
      const { logger } = server.config;
      server.middlewares.use(projectsMiddleware(logger));

      let timer;
      const refresh = () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          try {
            const { changed, catalog } = writeCatalog();
            if (changed) logger.info(`🐼 Project catalog updated (${catalog.length} visible).`, { timestamp: true });
          } catch (err) {
            logger.error(err.message, { timestamp: true });
            server.ws.send({ type: 'error', err: { message: err.message, stack: '' } });
          }
        }, 150);
      };

      const relevant = (file) => {
        if (!isInside(PROJECTS_DIR, file)) return false;
        const rel = path.relative(PROJECTS_DIR, file).split(path.sep);
        if (rel.includes('node_modules')) return false;
        // Top-level folders, and each project's index.html / project.json / thumbnail.
        return rel.length <= 2;
      };

      server.watcher.add(PROJECTS_DIR);
      for (const event of ['add', 'addDir', 'unlink', 'unlinkDir', 'change']) {
        server.watcher.on(event, (file) => relevant(file) && refresh());
      }
    },

    configurePreviewServer(server) {
      // GitHub Pages redirects /projects/foo → /projects/foo/; mirror that locally.
      server.middlewares.use((req, res, next) => {
        const m = req.url && req.url.match(/^\/projects\/([a-z0-9-]+)(\?.*)?$/);
        if (!m) return next();
        res.statusCode = 301;
        res.setHeader('Location', `/projects/${m[1]}/${m[2] ?? ''}`);
        res.end();
      });
    },
  };
}
