import { readdir } from 'node:fs/promises';
import { extname, resolve } from 'node:path';

const SOURCE_EXTENSIONS = new Set(['.cjs', '.cts', '.js', '.jsx', '.mjs', '.mts', '.ts', '.tsx']);
const IGNORED_DIRECTORIES = new Set(['.git', 'node_modules', 'coverage', '.nyc_output', 'test-results', 'dist', 'build']);

/** Discover supported workspace source files while excluding generated trees. */
export async function discoverPolicySources(cwd, readDirectory = readdir) {
  const root = resolve(cwd);
  const files = [];
  async function visit(directory) {
    for (const entry of await readDirectory(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(entry.name)) await visit(path);
      } else if (entry.isFile() && SOURCE_EXTENSIONS.has(extname(entry.name).toLowerCase())) files.push({ root, path });
    }
  }
  await visit(root);
  return files;
}
