import { isPureBarrelSource } from '../../../src/workspace/policy/pure-barrel.mjs';
test('detects pure barrels', () => { expect(isPureBarrelSource('export { x } from "x";')).toBe(true); expect(isPureBarrelSource('const x = 1;')).toBe(false); });
test('detects semicolon-free multiline barrels', () => {
  expect(isPureBarrelSource('import { x } from "x"\nexport { x }')).toBe(true);
  expect(isPureBarrelSource('export { x }\nconst y = 1')).toBe(false);
});
