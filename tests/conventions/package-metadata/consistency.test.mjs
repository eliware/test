import { checkPackageConsistency } from '../../../src/conventions/package-metadata/consistency.mjs';

const findings = (packageJson, options = {}) => checkPackageConsistency(packageJson, options).map(({ message }) => message);

test('requires public Eliware packages to publish documentation trees', () => {
  expect(findings({ name: '@eliware/log', files: ['README.md'] })).toEqual(expect.arrayContaining([
    'package.json: public Eliware packages must publish docs/',
    'package.json: public Eliware packages must publish specs/',
  ]));
});

test('requires the README description and matching attribution', () => {
  expect(findings({ name: '@eliware/log', description: 'Structured, secure ESM logging', author: 'Eliware', files: ['docs', 'specs'] }, {
    readme: 'A minimal logging library. MIT © 2025 Eli Sterling', licenseText: 'Copyright (c) Eli Sterling',
  })).toEqual(expect.arrayContaining([
    'README.md: public package description does not match package.json description',
    'README.md: attribution must identify Eliware',
    'README.md: attribution year must match the current release year',
    'LICENSE: attribution must identify Eliware',
  ]));
});
test('validates package file and bin consistency independently', () => { const result = checkPackageConsistency({ name: 'demo', version: '1.0.0', license: 'MIT', files: ['missing'], bin: './missing.mjs' }); expect(result.map(({ message }) => message)).toEqual(expect.arrayContaining([expect.stringContaining('bin.default'), expect.stringContaining('files entry')])); });
