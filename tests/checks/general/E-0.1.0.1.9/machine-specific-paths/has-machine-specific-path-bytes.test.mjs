import { expect, test } from "@jest/globals";
import { hasMachineSpecificPathBytes } from "../../../../../src/checks/general/E-0.1.0.1.9/machine-specific-paths/has-machine-specific-path-bytes.mjs";

test.each([
  Buffer.from(["C:", "Users", "dev", "src", "app"].join("\\")),
  Buffer.from(["", "users", "dev", "src", "app"].join("/")),
])("detects machine-specific paths in valid text: %s", (bytes) => {
  expect(hasMachineSpecificPathBytes(bytes)).toBe(true);
});

test("allows valid text without machine-specific paths", () => {
  expect(hasMachineSpecificPathBytes(Buffer.from("/var/lib/service"))).toBe(false);
});
