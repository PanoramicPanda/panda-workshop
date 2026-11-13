import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { copyStatic, isExcluded } from '../scripts/lib/copy.mjs';
import { makeTree, cleanup, canSymlink } from './helpers.mjs';

test('sensitive and development files are excluded', () => {
  for (const name of ['.env', '.env.local', '.env.production', 'prod.env', '.git', 'node_modules', 'project.json', 'package.json', 'package-lock.json', 'server.key', 'cert.pem', 'id_rsa', 'id_ed25519.pub', '.npmrc', 'debug.log', '.DS_Store', '.cache', '.vite']) {
    assert.equal(isExcluded(name), true, name);
  }
  for (const name of ['index.html', 'style.css', 'script.js', 'data.json', 'environment.js', 'keyboard.png', 'README.md']) {
    assert.equal(isExcluded(name), false, name);
  }
});

test('copies files byte-for-byte, preserving structure, skipping excluded', () => {
  const binary = Buffer.from([0, 1, 2, 255, 254, 13, 10, 13]);
  const src = makeTree({
    'index.html': '<link href="style.css">\r\n<img src="images/icon.png">',
    'style.css': 'body { color: red }',
    'images/icon.png': binary,
    'images/deep/nested/data.json': '{"a":1}',
    '.env': 'SECRET=1',
    '.env.local': 'SECRET=2',
    'project.json': '{}',
    'node_modules/lib/index.js': 'x',
    '.git/config': 'x',
    'keys/server.pem': 'x',
  });
  const dest = makeTree();
  try {
    const { files } = copyStatic(src, dest, { onWarn: () => {} });
    assert.deepEqual(files.sort(), ['images/deep/nested/data.json', 'images/icon.png', 'index.html', 'style.css']);
    assert.deepEqual(fs.readFileSync(path.join(dest, 'images/icon.png')), binary);
    assert.equal(fs.readFileSync(path.join(dest, 'index.html'), 'utf8'), '<link href="style.css">\r\n<img src="images/icon.png">');
    for (const gone of ['.env', '.env.local', 'project.json', 'node_modules', '.git', 'keys/server.pem']) {
      assert.equal(fs.existsSync(path.join(dest, gone)), false, gone);
    }
  } finally {
    cleanup(src);
    cleanup(dest);
  }
});

test('symlinks are never followed', { skip: !canSymlink() && 'symlinks not permitted here' }, () => {
  const outside = makeTree({ 'secret.txt': 'top secret' });
  const src = makeTree({ 'index.html': 'hi' });
  const dest = makeTree();
  try {
    fs.symlinkSync(path.join(outside, 'secret.txt'), path.join(src, 'leak.txt'));
    const warnings = [];
    const { files } = copyStatic(src, dest, { onWarn: (m) => warnings.push(m) });
    assert.deepEqual(files, ['index.html']);
    assert.equal(fs.existsSync(path.join(dest, 'leak.txt')), false);
    assert.equal(warnings.length, 1);
  } finally {
    cleanup(outside);
    cleanup(src);
    cleanup(dest);
  }
});
