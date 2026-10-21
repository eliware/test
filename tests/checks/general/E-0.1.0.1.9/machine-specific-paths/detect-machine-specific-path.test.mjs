import { expect, test } from "@jest/globals";
import { detectMachineSpecificPath } from "../../../../../src/checks/general/E-0.1.0.1.9/machine-specific-paths/detect-machine-specific-path.mjs";

test.each([
  [["C:", "Users", "dev", "src", "app"].join("\\"), true],
  [["", "users", "dev", "src", "app"].join("/"), true],
  ["/var/lib/service", false],
])("detects machine-specific paths in text %j", (text, expected) => {
  expect(detectMachineSpecificPath(text)).toBe(expected);
});
