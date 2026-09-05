import { checkPackageMetadata } from '../../src/conventions/package-metadata.mjs';

const valid = { name: 'demo', version: '1.0.0', description: 'demo', keywords: ['demo'], author: 'Eliware', license: 'MIT', repository: 'https://github.com/e/demo', homepage: 'https://github.com/e/demo', engines: { node: '>=26' }, scripts: { test: 'eliware-test', lint: 'eliware-test --lint' }, files: ['README.md', 'LICENSE', 'RELEASE_NOTES.md'], publishConfig: { access: 'public', provenance: true } };

test('accepts valid publishable metadata and consistency evidence', () => {
  expect(checkPackageMetadata(valid, { readme: 'demo', releaseNotes: '## 1.0.0', existingPaths: new Set(['README.md', 'LICENSE', 'RELEASE_NOTES.md']) })).toEqual([]);
});

test('validates package bin targets when present', () => {
  const options = { readme: 'demo', releaseNotes: '## 1.0.0', existingPaths: new Set(['README.md', 'LICENSE', 'RELEASE_NOTES.md', 'bin', 'bin/cli.mjs']), existingFiles: new Set(['README.md', 'LICENSE', 'RELEASE_NOTES.md', 'bin/cli.mjs']) };
  expect(checkPackageMetadata({ ...valid, bin: { demo: './bin/cli.mjs' } }, options)).toEqual([]);
  expect(checkPackageMetadata({ ...valid, bin: { demo: './bin/missing.mjs' } }, options).map(({ message }) => message)).toContain('package.json: bin.demo target does not exist: ./bin/missing.mjs');
  expect(checkPackageMetadata({ ...valid, bin: './bin/missing.mjs' }, options).map(({ message }) => message)).toContain('package.json: bin.default target does not exist: ./bin/missing.mjs');
});

test('reports missing fields, files, and consistency evidence', () => {
  expect(checkPackageMetadata({ name: 'demo' }, { existingPaths: new Set() }).map(({ message }) => message)).toEqual(expect.arrayContaining(['package.json: version must be a non-empty string', 'package.json: keywords must be a non-empty string array']));
});

test('checks publish metadata types, URLs, license, and consistency', () => {
  const invalid = { ...valid, keywords: [''], repository: { url: 'https://' }, bugs: { url: 'bad' }, homepage: 'bad', engines: {}, scripts: { test: '', lint: '' }, exports: null, files: ['README.md', 'MISSING'], publishConfig: null, license: 'Apache-2.0', version: '2.0.0' };
  const messages = checkPackageMetadata(invalid, { readme: '', releaseNotes: '', existingPaths: new Set(['README.md']) }).map(({ message }) => message);
  expect(messages).toEqual(expect.arrayContaining([
    'package.json: repository URL must be a valid http:// or https:// URL',
    'package.json: bugs URL must be a valid http:// or https:// URL',
    'package.json: homepage URL must be a valid http:// or https:// URL',
    'package.json: exports must be a string or object when present',
    'package.json: publishConfig must be an object for publishable packages',
    'package.json: license Apache-2.0 has no corresponding license file',
    'package.json: files entry does not exist: MISSING',
  ]));
  expect(checkPackageMetadata(null)).toEqual([]);
  expect(checkPackageMetadata({ __error: 'bad JSON' })).toEqual([{ group: 'package', message: 'package.json: bad JSON' }]);
  expect(checkPackageMetadata({ ...valid, engines: { node: '' }, exports: {} }, { readme: 'demo', releaseNotes: '## 1.0.0', existingPaths: new Set(['README.md', 'LICENSE', 'RELEASE_NOTES.md']) }).map(({ message }) => message)).toContain('package.json: engines.node must be a non-empty string when present');
  expect(checkPackageMetadata({ private: true }, { readme: '', releaseNotes: '' })).toEqual(expect.arrayContaining([{ group: 'package', message: 'package.json: name must be a non-empty string' }]));
});

test('requires canonical repository and homepage metadata for publishable packages', () => {
  const messages = checkPackageMetadata({ ...valid, repository: undefined, homepage: undefined }, { readme: 'demo', releaseNotes: '## 1.0.0', existingPaths: new Set(['README.md', 'LICENSE', 'RELEASE_NOTES.md']) }).map(({ message }) => message);
  expect(messages).toEqual(expect.arrayContaining([
    'package.json: publishable packages must declare repository metadata',
    'package.json: publishable packages must declare homepage metadata',
  ]));
});

test('validates directory and glob package file entries', () => {
  const options = { readme: 'demo', releaseNotes: '## 1.0.0', existingPaths: new Set(['README.md', 'LICENSE', 'RELEASE_NOTES.md', 'src/index.mjs', 'docs/guide.md']) };
  expect(checkPackageMetadata({ ...valid, files: ['README.md', 'LICENSE', 'RELEASE_NOTES.md', 'src/', 'docs/*.md'] }, options)).toEqual([]);
  expect(checkPackageMetadata({ ...valid, files: ['missing/', 'generated/*.js', 42] }, options).map(({ message }) => message)).toEqual(expect.arrayContaining([
    'package.json: files entry does not exist: missing/',
    'package.json: files entry does not exist: generated/*.js',
  ]));
});

test('enforces shared scripts and allows diagnostic flags only when enabled', () => {
  expect(checkPackageMetadata({ ...valid, scripts: { test: 'jest', lint: 'eslint' } }).map(({ message }) => message)).toEqual(expect.arrayContaining([
    'package.json: scripts.test must invoke eliware-test',
    'package.json: scripts.lint must invoke eliware-test --lint',
  ]));
  const flagged = { ...valid, scripts: { test: 'eliware-test --ignore-100x4 --ignore-monolith-limits', lint: 'eliware-test --lint' } };
  expect(checkPackageMetadata(flagged).map(({ message }) => message)).toEqual(expect.arrayContaining([
    expect.stringContaining('--ignore-100x4'), expect.stringContaining('--ignore-monolith-limits'),
  ]));
  expect(checkPackageMetadata(flagged, { allowCoverageOptOut: true, allowMonolithOptOut: true }).map(({ message }) => message)).not.toEqual(expect.arrayContaining([
    expect.stringContaining('--ignore-100x4'),
  ]));
  expect(checkPackageMetadata({ ...valid, scripts: { test: 'eliware-test', lint: 'eliware-test' } }).map(({ message }) => message)).toContain('package.json: scripts.lint must invoke eliware-test --lint');
  expect(checkPackageMetadata({ ...valid, scripts: { test: 'eliware-test', lint: 'eslint --lint' } }).map(({ message }) => message)).toContain('package.json: scripts.lint must invoke eliware-test --lint');
  expect(checkPackageMetadata({ ...valid, name: '@eliware/test', scripts: { test: 'node bin/eliware-test.mjs', lint: 'node bin/eliware-test.mjs --lint' } }, { allowSelfReference: true })).not.toEqual(expect.arrayContaining([
    expect.objectContaining({ message: expect.stringContaining('must invoke eliware-test') }),
  ]));
  expect(checkPackageMetadata({ ...valid, name: '@eliware/test', scripts: { test: 'node other.mjs', lint: 'node bin/eliware-test.mjs --lint' } }, { allowSelfReference: true }).map(({ message }) => message)).toContain('package.json: self-hosted scripts.test must execute node bin/eliware-test.mjs');
  expect(checkPackageMetadata({ ...valid, name: '@eliware/test', scripts: { test: 'node bin/eliware-test.mjs', lint: 'node other.mjs' } }, { allowSelfReference: true }).map(({ message }) => message)).toContain('package.json: self-hosted scripts.lint must execute node bin/eliware-test.mjs');
  expect(checkPackageMetadata({ ...valid, name: '@eliware/test', scripts: {} }, { allowSelfReference: true })).toEqual(expect.arrayContaining([
    expect.objectContaining({ message: expect.stringContaining('self-hosted scripts.test') }),
    expect.objectContaining({ message: expect.stringContaining('self-hosted scripts.lint') }),
  ]));
});
