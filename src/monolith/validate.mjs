import { discoverMonolithFiles } from './discover-files.mjs';
import { matchesExemption, readMonolithConfig } from './config.mjs';

export async function findMonolithViolations(cwd, options = {}) {
  const config = await readMonolithConfig(cwd, options.readFilePath);
  const files = await discoverMonolithFiles(cwd, options);
  return files.filter((entry) => !entry.generated && !entry.pureBarrel && !matchesExemption(entry.file, config.exemptions))
    .filter((entry) => entry.lines > config[entry.kind])
    .map((entry) => ({ ...entry, threshold: config[entry.kind] }));
}
