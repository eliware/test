import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseCoverage, parseCoverageJson } from '../coverage.mjs';
import { isPureBarrelFile } from '../istanbul.mjs';

export const COVERAGE_CANDIDATES = ['coverage/coverage-final.json', 'coverage/coverage.json', 'coverage.json'];

export async function readCoverageGaps(cwd, output, write, readFilePath = readFile) {
  for (const name of COVERAGE_CANDIDATES) {
    let raw;
    try { raw = await readFilePath(resolve(cwd, name), 'utf8'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; continue; }
    try {
      const json = JSON.parse(raw);
      if (hasUsableCoverage(json)) return parseCoverageJson(json);
      if (process.env.ELIWARE_TEST_DEBUG === '1') write(`Debug: Coverage candidate unusable: ${name}\n`);
    } catch {
      if (process.env.ELIWARE_TEST_DEBUG === '1') write(`Debug: Coverage candidate malformed: ${name}\n`);
    }
  }
  if (process.env.ELIWARE_TEST_DEBUG === '1') write('Debug: Coverage source: validated text fallback after unusable JSON candidates.\n');
  const textGaps = parseCoverage(output);
  if (!hasTextCoverageEvidence(output)) throw new Error('Coverage evidence missing: Jest produced no usable JSON or text coverage report.');
  return textGaps;
}

export async function pureBarrelSuggestions(cwd, gaps, readFilePath) {
  const suggestions = [];
  for (const gap of gaps) {
    if (!isZeroCoverageGap(gap)) continue;
    for (const candidate of [resolve(cwd, gap.file), resolve(cwd, 'src', gap.file)]) {
      if (await isPureBarrelFile(candidate, readFilePath)) {
        suggestions.push(`Pure barrel detected: ${gap.file}. Consider adding an Istanbul ignore directive to this barrel.`);
        break;
      }
    }
  }
  return suggestions.length > 0 ? `\n\n${suggestions.join('\n')}` : '';
}

export function hasUsableCoverage(json) {
  const entries = json && typeof json === 'object' && !Array.isArray(json) ? Object.values(json) : [];
  return entries.length > 0 && entries.every((data) => {
    if (!data || typeof data !== 'object' || !data.statementMap || typeof data.statementMap !== 'object' || Array.isArray(data.statementMap)
      || Object.keys(data.statementMap).length === 0 || !data.s || typeof data.s !== 'object'
      || Object.keys(data.s).length === 0 || !data.b || typeof data.b !== 'object'
      || !data.f || typeof data.f !== 'object') return false;
    const statementCountsValid = Object.values(data.s).every((count) => Number.isFinite(count));
    const statementKeysMatch = Object.keys(data.s).length === Object.keys(data.statementMap).length && Object.keys(data.s).every((key) => Object.hasOwn(data.statementMap, key));
    const branchCountsValid = Object.values(data.b).every((counts) => Array.isArray(counts) && counts.every((count) => Number.isFinite(count)));
    const functionCountsValid = Object.values(data.f).every((count) => Number.isFinite(count));
    const lineCountsValid = data.l === undefined || (data.l && typeof data.l === 'object' && !Array.isArray(data.l) && Object.entries(data.l).every(([line, count]) => Number.isInteger(Number(line)) && Number(line) > 0 && Number.isFinite(count)));
    return statementKeysMatch && statementCountsValid && branchCountsValid && functionCountsValid && lineCountsValid;
  });
}

function isZeroCoverageGap(gap) {
  const metrics = gap?.metrics;
  if (Array.isArray(metrics)) return metrics.length === 4 && metrics.every((metric) => /^0(?:\.0+)?%?$/.test(String(metric).trim()));
  return metrics && ['statements', 'branches', 'functions', 'lines'].every((metric) => metrics[metric] === 0);
}

function hasTextCoverageEvidence(output) {
  if (output.includes('[Output truncated:')) return false;
  const lines = output.split(/\r?\n/);
  const header = lines.some((line) => /^\s*File\s*\|\s*%\s*Stmts\s*\|\s*%\s*Branch\s*\|\s*%\s*Funcs\s*\|\s*%\s*Lines\s*\|/i.test(line));
  const metric = '\\d+(?:\\.\\d+)?(?:%\\s*\\(\\d+\\s*\\/\\s*\\d+\\))?';
  const row = lines.some((line) => new RegExp(`^\\s*[^|]+\\.(?:[cm]?[jt]s|jsx|tsx)\\s*\\|\\s*${metric}\\s*\\|\\s*${metric}\\s*\\|\\s*${metric}\\s*\\|\\s*${metric}(?:\\s*\\|.*)?\\s*$`).test(line));
  return header && row;
}
