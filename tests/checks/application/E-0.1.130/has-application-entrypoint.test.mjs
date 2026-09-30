import { expect, jest, test } from "@jest/globals";
import { join, resolve } from "node:path";
import { hasApplicationEntrypoint } from "../../../../src/checks/application/E-0.1.130/has-application-entrypoint.mjs";

test("requires every declared main and bin target to exist", () => {
  const root = resolve("repository-fixture");
  const inspectFile = jest.fn((path) => path === join(root, "bin", "app.mjs"));
  expect(
    hasApplicationEntrypoint(
      { main: "missing.mjs", bin: { app: "bin/app.mjs" } },
      root,
      inspectFile,
    ),
  ).toBe(false);
  expect(inspectFile).toHaveBeenCalledWith(join(root, "missing.mjs"));
  expect(inspectFile).not.toHaveBeenCalledWith(join(root, "bin", "app.mjs"));
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
  expect(hasApplicationEntrypoint({ main: "/repo/app.mjs" }, "C:\\repo", inspectFile)).toBe(false);
  expect(hasApplicationEntrypoint({ main: "C:/repo/app.mjs" }, "C:\\repo", inspectFile)).toBe(
    false,
  );
  expect(hasApplicationEntrypoint({ main: "src/../app.mjs" }, "C:\\repo", inspectFile)).toBe(false);
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
  expect(hasApplicationEntrypoint(undefined, "/repo")).toBe(false);
  expect(hasApplicationEntrypoint({ scripts: { start: "node server.mjs" } }, "/repo")).toBe(true);
  expect(hasApplicationEntrypoint({ scripts: { start: " " } }, "/repo")).toBe(false);
  expect(
    hasApplicationEntrypoint(
      { main: "missing.mjs", scripts: { start: "node server.mjs" } },
      "/repo",
      () => false,
    ),
  ).toBe(false);
});
