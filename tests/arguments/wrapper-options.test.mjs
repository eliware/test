import { readWrapperOptions } from '../../src/arguments/wrapper-options.mjs';
test('reads wrapper flags', () => expect(readWrapperOptions(['--lint', '--no-runInBand'])).toMatchObject({ lint: true, disableInBand: true }));
