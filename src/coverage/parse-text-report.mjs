import { parseCoverage } from './parse-text-coverage.mjs';

export function parseTextReport(text) {
  if (typeof text !== 'string') throw new TypeError('parseTextReport requires report text');
  return parseCoverage(text);
}
