import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { DEFAULT_THRESHOLDS } from './thresholds.mjs';
import { validateMonolithConfig } from './validate-config.mjs';

export async function readMonolithConfig(cwd, readFilePath = readFile) {
  try {
    const configured = JSON.parse(await readFilePath(resolve(cwd, 'package.json')))?.eliwareTest?.monolithLimits ?? {};
    return validateMonolithConfig({
      source: configured.source ?? DEFAULT_THRESHOLDS.source,
      test: configured.tests ?? DEFAULT_THRESHOLDS.test,
      exemptions: configured.exemptions ?? [],
    });
  } catch (error) {
    if (error.code === 'ENOENT') return { ...DEFAULT_THRESHOLDS, exemptions: [] };
    throw error;
  }
}
