import { relative } from 'node:path';
import { isPureBarrelSource } from './pure-barrel.mjs';

const IGNORED_DIRECTIVE = /(?:\/\*\s*\*?\s*|\/\/\s*)istanbul\s+ignore\b/i;
export function scanIstanbulSource(root, path, source) {
  const match = source.match(IGNORED_DIRECTIVE);
  if (!match || isPureBarrelSource(source)) return null;
  return { file: relative(root, path).replaceAll('\\', '/'), line: source.slice(0, match.index).split(/\r?\n/).length };
}
