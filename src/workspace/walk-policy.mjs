import { IGNORED_DIRECTORIES } from './exclusion-patterns.mjs';

export const WALK_LIMITS = Object.freeze({ maxDepth: 100, maxFiles: 10_000 });
export function sortWorkspaceEntries(entries) { return [...entries].sort((left, right) => Number(left.name > right.name) - Number(left.name < right.name)); }
export function shouldTraverseDirectory(name) { return !IGNORED_DIRECTORIES.has(name); }
