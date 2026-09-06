import { isUsableCoverageEntry } from './is-usable-coverage-entry.mjs';

/** Normalize one validated Istanbul file entry into safe integer counters. */
export function normalizeCoverageEntry(file, data) {
  if (!isUsableCoverageEntry(data)) throw new Error(`Malformed coverage entry: ${file}`);
  return {
    ...data,
    s: Object.fromEntries(Object.entries(data.s).map(([id, count]) => [id, normalizeCoverageCount(file, count)])),
    b: Object.fromEntries(Object.entries(data.b).map(([id, counts]) => [id, counts.map((count) => normalizeCoverageCount(file, count))])),
    f: Object.fromEntries(Object.entries(data.f).map(([id, count]) => [id, normalizeCoverageCount(file, count)])),
  };
}

export function normalizeCoverageCount(file, value) {
  const count = Number(value);
  if (!Number.isSafeInteger(count) || count < 0) throw new Error(`Malformed coverage entry: ${file}`);
  return count;
}
