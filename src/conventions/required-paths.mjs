export const REQUIRED_REPOSITORY_PATHS = Object.freeze([
  'README.md', 'AGENTS.md', 'RELEASE_NOTES.md', 'docs', 'specs', 'examples', '.env.example'
]);

export async function findMissingRequiredPaths(cwd, accessPath, exceptions = []) {
  const missing = [];
  for (const path of REQUIRED_REPOSITORY_PATHS) {
    if (exceptions.includes(path)) continue;
    try {
      await accessPath(resolve(cwd, path));
    } catch {
      missing.push(path);
    }
  }
  return missing;
}
import { resolve } from 'node:path';
