const MAX_DRIFTS = 20;

function appendDrifts(lines, entries, format) {
  const unique = [...new Set(entries)];
  for (const entry of unique.slice(0, MAX_DRIFTS)) lines.push(format(entry));
  if (unique.length > MAX_DRIFTS) lines.push(`  ... ${unique.length - MAX_DRIFTS} more omitted`);
}

/** Format source/test mapping drift diagnostics for users. */
export function formatMappingDrifts({ missingTests = [], orphanTests = [] }) {
  const lines = ['Source/test mapping drift detected:'];
  appendDrifts(lines, missingTests, (module) => `  Missing test pair: src/${module}.mjs (expected tests/${module}.test.mjs)`);
  appendDrifts(lines, orphanTests, (module) => `  Test without source pair: tests/${module}.test.mjs`);
  return `${lines.join('\n')}\n`;
}
