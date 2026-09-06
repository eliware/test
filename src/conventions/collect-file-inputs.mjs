import { relative, resolve } from 'node:path';
import { walkFiles } from '../workspace/walk-files.mjs';

/** Discover repository files and classify convention-relevant paths. */
export async function collectFileInputs(cwd, readDirectoryOnce) {
  const root = resolve(cwd);
  const entries = await readDirectoryOnce(root, { withFileTypes: true });
  const paths = new Set(entries.map((entry) => entry.name));
  const files = new Set();
  await walkFiles(root, async (path) => {
    const relativePath = relative(root, path).replaceAll('\\', '/');
    paths.add(relativePath);
    files.add(relativePath);
  }, { readDirectory: readDirectoryOnce });
  return {
    paths,
    files,
    specFiles: [...files].filter((path) => path.startsWith('specs/') && path.endsWith('.md')).map((path) => path.slice('specs/'.length)),
    docsFiles: [...files].filter((path) => path.startsWith('docs/') && path.endsWith('.md')).map((path) => path.slice('docs/'.length)),
    nonMarkdownFiles: [...files].filter((path) => /^(?:docs|specs)\//.test(path) && !path.endsWith('.md')),
    exampleFiles: [...files].filter((path) => path.startsWith('examples/') && path !== 'examples/README.md' && !path.toLowerCase().endsWith('/readme.md')).map((path) => path.slice('examples/'.length)),
  };
}
