import { expect, test } from "@jest/globals";
import { isPureExportBarrel } from "../../../../src/checks/shared/is/pure-export-barrel.mjs";

test.each([
  'export { value } from "../value.mjs";',
  'export * from "../value.mjs";',
  'import { value } from "../value.mjs"; export { value };',
  '// comment\nexport {\n value,\n} from "../value.mjs";',
])("recognizes pure re-export modules", (source) => {
  expect(isPureExportBarrel(source)).toBe(true);
});

test.each([
  "",
  "export {};",
  'export { } from "../value.mjs";',
  "export {",
  'import { unused } from "../unused.mjs"; export { value } from "../value.mjs";',
  'import { value } from "../value.mjs"; export * from "../other.mjs"; export { value };',
  'import "../setup.mjs"; export { value } from "../value.mjs";',
  "export const value = 1;",
])("rejects modules that are not pure re-export barrels", (source) => {
  expect(isPureExportBarrel(source)).toBe(false);
});
