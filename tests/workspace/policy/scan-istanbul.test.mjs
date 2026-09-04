import { scanIstanbulSource } from '../../../src/workspace/policy/scan-istanbul.mjs';
test('reports Istanbul directives', () => { const directive = '/* ' + 'istanbul ignore next */'; expect(scanIstanbulSource('.', 'src/a.mjs', directive + '\nexport const x = 1;')).toMatchObject({ file: 'src/a.mjs', line: 1 }); });
