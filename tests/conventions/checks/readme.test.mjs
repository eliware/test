import { checkReadme } from '../../../src/conventions/checks/readme.mjs';

test('accepts a complete README with indexed directory links', () => {
  const readme = '# Demo\n\nIntro.\n\n## Requirements\n## Installation\n## Usage\n## Configuration\n## Validation\n## Security\n## Support\n## License\n\n[specs](specs/)';
  expect(checkReadme(readme, new Set(['specs']), [], {}, { indexFiles: new Set(['specs/README.md']) })).toEqual([]);
});

test('reports removed and unresolved README links', () => {
  const readme = '# Demo\n\n## Requirements\n## Installation\n## Usage\n## Configuration\n## Validation\n## Security\n## Support\n## License\n\n[specs](spec/) [missing](missing.md)';
  const messages = checkReadme(readme, new Set(['specs']), ['README.md']).map(({ message }) => message);
  expect(messages).toContain('README.md: references removed path spec/');
  expect(messages).toContain('README.md: relative link does not resolve: missing.md');
});

test('requires the standard branded opening for public Eliware packages', () => {
  const headings = '# @eliware/demo\n\n## Requirements\n## Installation\n## Usage\n## Configuration\n## Validation\n## Security\n## Support\n## License';
  expect(checkReadme(headings, new Set(), [], { name: '@eliware/demo' }).map(({ message }) => message)).toContain('README.md: public Eliware packages must use the standard branded opening');
  const branded = '# [![eliware.org](https://eliware.org/logos/brand.png)](https://discord.gg/M6aTR9eTwN)\n\n## @eliware/demo';
  expect(checkReadme(branded, new Set(), [], { name: '@eliware/demo' }).map(({ message }) => message)).not.toContain('README.md: public Eliware packages must use the standard branded opening');
});

test('requires navigable indexes for linked directories', () => {
  const readme = '# Demo\n\n## Requirements\n## Installation\n## Usage\n## Configuration\n## Validation\n## Security\n## Support\n## License\n\n[docs](docs/)';
  expect(checkReadme(readme, new Set(['docs']), [], {}, { existingFiles: new Set() })).toEqual(expect.arrayContaining([expect.objectContaining({ message: expect.stringContaining('directory link') })]));
});

test('supports default README options', () => {
  expect(checkReadme('# Demo')).toEqual(expect.arrayContaining([expect.objectContaining({ message: expect.stringContaining('requirements') })]));
});
