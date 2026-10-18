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

test.each([Buffer.from([0xff, 0xfe]), Buffer.from([0x2f, 0x68, 0x6f, 0x6d, 0x65, 0x00])])(
  "skips binary or invalid UTF-8 bytes: %s",
  (bytes) => {
    expect(hasMachineSpecificPathBytes(bytes)).toBe(false);
  },
);
