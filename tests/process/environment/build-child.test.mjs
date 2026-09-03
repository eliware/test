import { buildChildOptions } from '../../../src/process/environment/build-child.mjs';
test('builds portable child options', () => { expect(buildChildOptions({ cwd: 'C:/repo', inheritEnv: false, env: { SAFE: 'yes' } })).toMatchObject({ cwd: 'C:/repo', windowsHide: true, env: { SAFE: 'yes' } }); });
