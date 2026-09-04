import { readFile } from 'node:fs/promises';
import { readMonolithConfig } from './config.mjs';
import { scanMonolithFiles } from './scan-files.mjs';

export async function readMonolithInputs(cwd, options = {}) {
  const config = await readMonolithConfig(cwd, options.readFilePath ?? readFile);
  const files = await scanMonolithFiles(cwd, options.readDirectory, options.readSource ?? readFile);
  return { config, files };
}
