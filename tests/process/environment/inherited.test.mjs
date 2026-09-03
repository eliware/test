import { inheritedEnvironment } from '../../../src/process/environment/inherited.mjs';
test('selects inherited or empty environment', () => { expect(inheritedEnvironment({})).toBe(process.env); expect(inheritedEnvironment({ inheritEnv: false })).toEqual({}); });
