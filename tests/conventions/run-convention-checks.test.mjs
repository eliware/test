import { runConventionChecks } from '../../src/conventions/run-convention-checks.mjs';

test('runs convention checks against a collected snapshot', async () => {
  const read = async () => '';
  const findings = await runConventionChecks({
    exceptions: [], findings: [], read, paths: new Set(), files: new Set(), specFiles: [], docsFiles: [],
    nonMarkdownFiles: [], exampleFiles: [], specText: '', examples: [], environmentSources: [],
    exampleReadmes: new Map(), examplePackages: new Map(), specTexts: new Map(), packageJson: {},
  });
  expect(findings).toEqual(expect.any(Array));
});
