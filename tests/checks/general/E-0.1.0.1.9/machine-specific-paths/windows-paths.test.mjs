import { expect, test } from "@jest/globals";
import { hasWindowsMachineSpecificPath } from "../../../../../src/checks/general/E-0.1.0.1.9/machine-specific-paths/windows-paths.mjs";

test("detects machine-specific Windows home and source paths", () => {
  expect(hasWindowsMachineSpecificPath(["C:", "Users", "eli", "project"].join("\\"))).toBe(true);
  expect(hasWindowsMachineSpecificPath(["D:", "eliware", "project"].join("/"))).toBe(true);
});

test("ignores generic Windows paths and repository labels", () => {
  expect(
    hasWindowsMachineSpecificPath(["C:", "work", "project"].join("\\") + " eliware-internal"),
  ).toBe(false);
});
