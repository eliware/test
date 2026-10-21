import { expect, test } from "@jest/globals";
import { hasMachineSpecificPathBytes } from "../../../../../src/checks/general/E-0.1.0.1.9/machine-specific-paths/has-machine-specific-path-bytes.mjs";

test("detects machine-specific paths in decoded bytes", () => {
  expect(
    hasMachineSpecificPathBytes(Buffer.from(["C:", "Users", "dev", "src", "app"].join("\\"))),
  ).toBe(true);
});

test("allows valid bytes without machine-specific paths", () => {
  expect(hasMachineSpecificPathBytes(Buffer.from("/var/lib/service"))).toBe(false);
});

test("skips bytes that contain a NUL byte", () => {
  expect(hasMachineSpecificPathBytes(Buffer.from([0x61, 0x00, 0x62]))).toBe(false);
});
