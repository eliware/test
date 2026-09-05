import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const markdownRoots = ['README.md', 'SPEC.md', 'RELEASE_NOTES.md', 'docs', 'examples', 'specs'];
const markdownLink = /!?\[[^\]]*\]\(([^)\s]+)(?:\s+[^)]*)?\)/g;
const files = [];

function collect(path) {
  if (path.endsWith('.md')) {
    files.push(path);
    return;
  }
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const child = resolve(path, entry.name);
    if (entry.isDirectory()) collect(child);
    else if (entry.isFile() && entry.name.endsWith('.md')) files.push(child);
  }
}

for (const relativePath of markdownRoots) collect(resolve(root, relativePath));

const failures = [];
for (const file of files) {
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(markdownLink)) {
    const reference = match[1].replace(/[?#].*$/, '');
    if (!reference || reference.startsWith('http://') || reference.startsWith('https://') || reference.startsWith('mailto:')) continue;
    const target = resolve(dirname(file), reference);
    if (!existsSync(target) && !existsSync(`${target}.md`) && !existsSync(resolve(target, 'README.md'))) {
      failures.push(`${file.slice(root.length + 1)} -> ${reference}`);
    }
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Documentation links passed: ${files.length} Markdown files`);
}
