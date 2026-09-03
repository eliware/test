import { isPureBarrelSource } from '../../../src/workspace/policy/istanbul.mjs';
test('recognizes pure re-export barrels', () => { expect(isPureBarrelSource('export { value } from "./value.mjs";')).toBe(true); expect(isPureBarrelSource('const value = 1;')).toBe(false); });
