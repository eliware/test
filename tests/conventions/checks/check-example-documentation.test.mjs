import { checkExampleDocumentation } from '../../../src/conventions/checks/check-example-documentation.mjs';

test('checks example index and guidance', () => {
  expect(checkExampleDocumentation()).toEqual(expect.any(Array));
  const findings = checkExampleDocumentation({ examples: ['minimal'], examplesReadme: '', exampleReadmes: new Map(), exampleFiles: ['minimal/run.mjs'] });
  expect(findings).toEqual(expect.arrayContaining([expect.objectContaining({ message: expect.stringContaining('examples/') })]));
});
