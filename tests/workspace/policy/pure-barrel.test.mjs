import { isPureBarrelSource } from '../../../src/workspace/policy/pure-barrel.mjs';
test('detects pure barrels', () => { expect(isPureBarrelSource('export { x } from "x";')).toBe(true); expect(isPureBarrelSource('const x = 1;')).toBe(false); });
