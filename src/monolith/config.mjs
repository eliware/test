import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { DEFAULT_LIMITS } from './constants.mjs';

export async function readMonolithConfig(cwd, readFilePath = readFile) {
  let raw;
  try { raw = await readFilePath(resolve(cwd, 'package.json'), 'utf8'); }
  catch (error) { if (error.code === 'ENOENT') return { ...DEFAULT_LIMITS, exemptions: [] }; throw error; }
  const configured = JSON.parse(raw)?.eliwareTest?.monolithLimits ?? {};
  const limits = { source: configured.source ?? DEFAULT_LIMITS.source, test: configured.tests ?? DEFAULT_LIMITS.test };
  if (![limits.source, limits.test].every((value) => Number.isInteger(value) && value > 0)) throw new Error('monolith limits must be positive integers');
  const exemptions = configured.exemptions ?? [];
  if (!Array.isArray(exemptions) || exemptions.some((item) => !item || typeof item.pattern !== 'string' || !item.pattern || typeof item.reason !== 'string' || !item.reason.trim())) {
    throw new Error('each monolith exemption requires a pattern and non-empty reason');
  }
  return { ...limits, exemptions };
}

export function matchesExemption(file, exemptions) {
  return exemptions.some(({ pattern }) => new RegExp(`^${pattern.split('*').map(escapeRegExp).join('.*')}$`).test(file));
}

function escapeRegExp(value) { return value.replace(/[.+?^${}()|[\]\\]/g, '\\$&'); }
