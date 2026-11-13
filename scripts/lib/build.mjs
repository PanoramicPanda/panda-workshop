import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { assertInside, projectBasePath } from './paths.mjs';
import { copyStatic } from './copy.mjs';

function run(command, { cwd, env, label }) {
  return new Promise((resolve, reject) => {
    console.log(`  $ ${command}`);
    const child = spawn(command, { cwd, env, shell: true, stdio: 'inherit' });
    child.on('error', (err) => reject(new Error(`${label}: could not start "${command}": ${err.message}`)));
    child.on('exit', (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${label}: "${command}" failed (${signal ? `signal ${signal}` : `exit code ${code}`}).`));
    });
  });
}

/** Absolute path of a built project's output folder (validated to be inside the project). */
export function buildOutputDir(project) {
  return assertInside(project.dir, path.join(project.dir, project.build.output), `build output for "${project.slug}"`);
}

/**
 * Installs dependencies with `npm ci` and runs the project's build command with
 * PROJECT_BASE_PATH=/projects/<slug>/. Throws on any failure.
 */
export async function runProjectBuild(project) {
  const label = `projects/${project.slug}`;
  const env = {
    ...process.env,
    PROJECT_BASE_PATH: projectBasePath(project.slug),
    NODE_ENV: 'production',
  };
  const outDir = buildOutputDir(project);
  fs.rmSync(outDir, { recursive: true, force: true });

  // Install dev deps too (vite lives there) even though NODE_ENV=production.
  await run('npm ci --include=dev --no-audit --no-fund', { cwd: project.dir, env, label });
  await run(project.build.command, { cwd: project.dir, env, label });

  if (!fs.existsSync(outDir) || !fs.lstatSync(outDir).isDirectory()) {
    throw new Error(`${label}: build finished but the output folder "${project.build.output}" was not created.`);
  }
  if (!fs.existsSync(path.join(outDir, 'index.html'))) {
    throw new Error(`${label}: build output "${project.build.output}" has no index.html.`);
  }
  return outDir;
}

/** Publishes a project (static or built) into `destRoot/projects/<slug>/`. */
export async function publishProject(project, destRoot) {
  const dest = path.join(destRoot, 'projects', project.slug);
  fs.rmSync(dest, { recursive: true, force: true });
  let source = project.dir;
  if (project.mode === 'build') source = await runProjectBuild(project);
  const result = copyStatic(source, dest);
  return { dest, ...result };
}
