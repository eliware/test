import { metricHasGap } from './metric.mjs';

const coverageLine = /^\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)(?:\s*\|\s*([^|]+?))?\s*\|?\s*$/;
const ANSI_PATTERN = new RegExp(`${String.fromCharCode(27)}\\[[0-?]*[ -/]*[@-~]`, 'g');

export function parseCoverage(text) {
  return text.split(/\r?\n/).flatMap((line) => {
    const cleanLine = line.replace(ANSI_PATTERN, '');
    const match = cleanLine.match(coverageLine);
    if (!match || /^-+$/.test(match[1].trim()) || match[1].trim() === 'All files' || match[1].trim() === 'File') return [];
    const metrics = match.slice(2, 6);
    return metrics.some(metricHasGap) ? [{ file: match[1].trim(), metrics }] : [];
  });
}
