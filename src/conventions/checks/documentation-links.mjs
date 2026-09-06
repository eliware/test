import { posix } from 'node:path';

export const LINK_PATTERN = /!?\[[^\]]*\]\(([^)\s]+)(?:\s+[^)]*)?\)/g;
export function resolveIndexLink(link, directory) { return posix.normalize(posix.join(directory, link.replace(/[?#].*$/, ''))); }
export function hasDirectLink(source, target, directory) { return [...source.matchAll(LINK_PATTERN)].some(([, link]) => resolveIndexLink(link, directory) === resolveIndexLink(target, directory)); }
export function hasDescribedLink(source, target, directory) { return [...source.matchAll(LINK_PATTERN)].some(([full, link]) => resolveIndexLink(link, directory) === resolveIndexLink(target, directory) && full.slice(full.indexOf('[') + 1, full.indexOf(']')).trim()); }
export function hasFileLink(source, target, files, directory) { return [...source.matchAll(LINK_PATTERN)].some(([, link]) => resolveIndexLink(link, directory) === resolveIndexLink(target, directory) && files.has(resolveIndexLink(link, directory))); }
export function hasAnyFileLink(texts, target) {
  const normalizedTarget = posix.normalize(target);
  for (const [source, text] of texts) {
    const directory = posix.dirname(source);
    if ([...text.matchAll(LINK_PATTERN)].some(([, link]) => resolveIndexLink(link, directory) === normalizedTarget)) return true;
  }
  return false;
}
