import { checkAgents, checkReadme, checkSpecifications } from '../../src/conventions/markdown-checks.mjs';

test('checks README structure and local links', () => {
  const readme = '# Demo\n\nIntro.\n\n## Requirements\n## Installation\n## Usage\n## Configuration\n## Validation\n## Security\n## Support\n## License\n\n[specs](specs/)';
  expect(checkReadme(readme, new Set(['specs']))).toEqual([]);
  expect(checkReadme(readme.replace('specs/', 'spec/'), new Set(['specs']))).toEqual(expect.arrayContaining([{ group: 'readme', message: 'README.md: references removed path spec/' }]));
  expect(checkReadme(readme.replace('(specs/)', '(missing.md)'), new Set(['specs']), ['README.md'])).toEqual(expect.arrayContaining([{ group: 'readme', message: 'README.md: relative link does not resolve: missing.md' }]));
});

test('requires the standard branded opening for public Eliware packages', () => {
  const readme = '# @eliware/demo\n\n## Requirements\n## Installation\n## Usage\n## Configuration\n## Validation\n## Security\n## Support\n## License';
  expect(checkReadme(readme, new Set(), [], { name: '@eliware/demo' }).map(({ message }) => message)).toContain('README.md: public Eliware packages must use the standard branded opening');
  const branded = '# [![eliware.org](https://eliware.org/logos/brand.png)](https://discord.gg/M6aTR9eTwN)\n\n## @eliware/demo';
  expect(checkReadme(branded, new Set(), [], { name: '@eliware/demo' })).not.toEqual(expect.arrayContaining([{ group: 'readme', message: 'README.md: public Eliware packages must use the standard branded opening' }]));
});

test('requires overview links and an out-of-scope specification', () => {
  expect(checkSpecifications(['scope.md', 'out-of-scope.md'], 'scope.md out-of-scope.md', 'out-of-scope.md')).toEqual([]);
  expect(checkSpecifications(['scope.md'], 'scope.md', '')).toEqual(expect.arrayContaining([{ group: 'specifications', message: 'specs/: missing an explicit out-of-scope document or section' }]));
  expect(checkSpecifications([], '', '')).toEqual(expect.arrayContaining([
    { group: 'specifications', message: 'specs/: contains no Markdown documents' },
    { group: 'specifications', message: 'specs/: missing a clear overview/index document' },
  ]));
  expect(checkSpecifications(['scope.md', 'other.md'], 'scope.md', 'other.md')).toEqual(expect.arrayContaining([{ group: 'specifications', message: 'specs/: overview does not link to every specification document' }]));
});

test('checks deterministic AGENTS scope and exception markers', () => {
  expect(checkAgents('Applies to: repository-wide.')).toEqual([]);
  expect(checkAgents('')).toEqual(expect.arrayContaining([expect.objectContaining({ message: expect.stringContaining('Applies to') })]));
  expect(checkAgents('Applies to: repository-wide.', ['examples'])).toEqual(expect.arrayContaining([expect.objectContaining({ message: expect.stringContaining('deviations') })]));
  expect(checkAgents('Applies to: repository-wide.\n## Intentional deviations', ['examples'])).toEqual([]);
});
