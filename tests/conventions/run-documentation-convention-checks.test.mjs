import { runDocumentationConventionChecks } from '../../src/conventions/run-documentation-convention-checks.mjs';

test('runs documentation convention checks', async () => {
  const result = await runDocumentationConventionChecks({ read: async () => '', specFiles: [], specText: '', environmentSources: [], docsFiles: [], specTexts: new Map(), exampleReadmes: new Map(), examplePackages: new Map(), nonMarkdownFiles: [], exampleFiles: [], files: new Set(), examples: [] });
  expect(result).toEqual(expect.any(Array));
});
