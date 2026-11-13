import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/** Creates a temp directory; `files` maps relative paths to contents (string or Buffer). */
export function makeTree(files = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'panda-test-'));
  writeTree(root, files);
  return root;
}

export function writeTree(root, files) {
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(root, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    if (content !== null) fs.writeFileSync(full, typeof content === 'string' || Buffer.isBuffer(content) ? content : JSON.stringify(content));
    else fs.mkdirSync(full, { recursive: true });
  }
}

export function cleanup(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

export function canSymlink() {
  const dir = makeTree({ 'a.txt': 'x' });
  try {
    fs.symlinkSync(path.join(dir, 'a.txt'), path.join(dir, 'link'));
    return true;
  } catch {
    return false;
  } finally {
    cleanup(dir);
  }
}
