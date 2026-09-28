import { expect, jest, test } from "@jest/globals";
import { hasApplicationEntrypoint } from "../../../../src/checks/application/E-0.1.130/has-application-entrypoint.mjs";

test("accepts existing main and bin file targets", () => {
  const inspectFile = jest.fn((path) => path === "C:\\repo\\bin\\app.mjs");
  expect(
    hasApplicationEntrypoint(
      { main: "missing.mjs", bin: { app: "bin/app.mjs" } },
      "C:\\repo",
      inspectFile,
    ),
  ).toBe(true);
  expect(inspectFile).toHaveBeenCalledWith("C:\\repo\\missing.mjs");
  expect(inspectFile).toHaveBeenCalledWith("C:\\repo\\bin\\app.mjs");
});

test("checks real files and handles missing entrypoint targets", () => {
  expect(hasApplicationEntrypoint({ main: "bin/eliware-test.mjs" }, process.cwd())).toBe(true);
  expect(hasApplicationEntrypoint({ main: "missing.mjs" }, process.cwd())).toBe(false);
  expect(hasApplicationEntrypoint({ bin: "bin/eliware-test.mjs" }, process.cwd())).toBe(true);
});

test("rejects empty, invalid, or nonexistent file targets", () => {
  const inspectFile = jest.fn(() => false);
  expect(hasApplicationEntrypoint({ bin: {} }, "C:\\repo", inspectFile)).toBe(false);
  expect(hasApplicationEntrypoint({ bin: { app: "" } }, "C:\\repo", inspectFile)).toBe(false);
  expect(hasApplicationEntrypoint({ bin: { app: 7 } }, "C:\\repo", inspectFile)).toBe(false);
  expect(hasApplicationEntrypoint({ main: "missing.mjs" }, "C:\\repo", inspectFile)).toBe(false);
  expect(hasApplicationEntrypoint({ main: "../outside.mjs" }, "C:\\repo", inspectFile)).toBe(false);
});

test("rejects a broken bin target even when another bin target exists", () => {
  const inspectFile = (path) => path === "C:\\repo\\bin\\valid.mjs";
  expect(
    hasApplicationEntrypoint(
      { bin: { valid: "bin/valid.mjs", broken: 7 }, scripts: { start: "node server.mjs" } },
      "C:\\repo",
      inspectFile,
    ),
  ).toBe(false);
});

test("accepts a nonempty start command without a file target", () => {
  expect(hasApplicationEntrypoint({ scripts: { start: "node server.mjs" } }, "/repo")).toBe(true);
  expect(hasApplicationEntrypoint({ scripts: { start: " " } }, "/repo")).toBe(false);
});
