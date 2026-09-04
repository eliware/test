/** Format source/test mapping drift diagnostics for users. */
export function formatMappingDrifts({ missingTests = [], orphanTests = [] }) {
  const lines = ['Source/test mapping drift detected:'];
  for (const module of missingTests) lines.push(`  Missing test pair: src/${module}.mjs (expected tests/${module}.test.mjs)`);
  for (const module of orphanTests) lines.push(`  Test without source pair: tests/${module}.test.mjs`);
  return `${lines.join('\n')}\n`;
}
