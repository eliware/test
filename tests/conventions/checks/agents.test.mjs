import { checkAgents } from '../../../src/conventions/checks/agents.mjs';

test('requires repository scope and exception guidance', () => {
  expect(checkAgents('', ['docs'])).toHaveLength(2);
  expect(checkAgents('Applies to: repository-wide.\n## Intentional deviations', ['docs'])).toEqual([]);
});

test('requires an explicit deviations section when subtree exceptions exist', () => {
  expect(checkAgents('Applies to: repository-wide.', ['examples'])).toEqual(expect.arrayContaining([expect.objectContaining({ message: expect.stringContaining('deviations') })]));
});

test('supports the default exception list', () => {
  expect(checkAgents('Applies to: repository-wide.')).toEqual([]);
});
