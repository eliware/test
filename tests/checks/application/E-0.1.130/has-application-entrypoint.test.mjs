import { expect, jest, test } from "@jest/globals";
import { join, resolve } from "node:path";
import { hasApplicationEntrypoint } from "../../../../src/checks/application/E-0.1.130/has-application-entrypoint.mjs";

test("requires every declared main and bin target to exist under bin/", () => {
  const root = resolve("repository-fixture");
  const inspectFile = jest.fn((path) => path === join(root, "bin", "app.mjs"));
  expect(
    hasApplicationEntrypoint(
      { main: "bin/missing.mjs", bin: { app: "bin/app.mjs" } },
      root,
      inspectFile,
    ),
  ).toBe(false);
  expect(inspectFile).toHaveBeenCalledWith(join(root, "bin", "missing.mjs"));
  expect(inspectFile).not.toHaveBeenCalledWith(join(root, "bin", "app.mjs"));
});

test("checks real files and handles missing entrypoint targets", () => {
  expect(hasApplicationEntrypoint({ main: "bin/eliware-test.mjs" }, process.cwd())).toBe(true);
  expect(hasApplicationEntrypoint({ main: "./bin/eliware-test.mjs" }, process.cwd())).toBe(true);
  expect(hasApplicationEntrypoint({ main: "bin/missing.mjs" }, process.cwd())).toBe(false);
  expect(hasApplicationEntrypoint({ main: "missing.mjs" }, process.cwd())).toBe(false);
  expect(
    hasApplicationEntrypoint(
      { main: "src/checks/application/E-0.1.130/has-application-entrypoint.mjs" },
      process.cwd(),
    ),
  ).toBe(false);
  expect(hasApplicationEntrypoint({ bin: "bin/eliware-test.mjs" }, process.cwd())).toBe(true);
});

test("rejects empty, invalid, or nonexistent file targets", () => {
  const inspectFile = jest.fn(() => false);
  expect(hasApplicationEntrypoint({ bin: {} }, "C:\\repo", inspectFile)).toBe(false);
  expect(hasApplicationEntrypoint({ bin: { app: "" } }, "C:\\repo", inspectFile)).toBe(false);
  expect(hasApplicationEntrypoint({ bin: { app: 7 } }, "C:\\repo", inspectFile)).toBe(false);
  expect(hasApplicationEntrypoint({ main: "missing.mjs" }, "C:\\repo", inspectFile)).toBe(false);
  expect(hasApplicationEntrypoint({ main: "application.mjs" }, "C:\\repo", inspectFile)).toBe(
    false,
  );
  expect(hasApplicationEntrypoint({ bin: { app: "src/app.mjs" } }, "C:\\repo", inspectFile)).toBe(
    false,
  );
  expect(hasApplicationEntrypoint({ main: "bin/../src/app.mjs" }, "C:\\repo", inspectFile)).toBe(
    false,
  );
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

test("requires a declared bin entrypoint even when a start command exists", () => {
  expect(hasApplicationEntrypoint(undefined, "/repo")).toBe(false);
  expect(hasApplicationEntrypoint({ scripts: { start: "node bin/server.mjs" } }, "/repo")).toBe(
    false,
  );
  expect(
    hasApplicationEntrypoint({ main: "", bin: {}, scripts: { start: "node server.mjs" } }, "/repo"),
  ).toBe(false);
  expect(
    hasApplicationEntrypoint({ main: "  ", scripts: { start: "node server.mjs" } }, "/repo"),
  ).toBe(false);
  expect(hasApplicationEntrypoint({ scripts: { start: " " } }, "/repo")).toBe(false);
  expect(
    hasApplicationEntrypoint(
      { main: "missing.mjs", scripts: { start: "node server.mjs" } },
      "/repo",
      () => false,
    ),
  ).toBe(false);
});

test("requires a start script to invoke its declared bin entrypoint", () => {
  const root = resolve("repository-fixture");
  const inspectFile = (path) => path === join(root, "bin", "app.mjs");
  expect(
    hasApplicationEntrypoint(
      { bin: { app: "bin/app.mjs" }, scripts: { start: "node bin/app.mjs" } },
      root,
      inspectFile,
    ),
  ).toBe(true);
  expect(
    hasApplicationEntrypoint(
      { main: "./bin/app.mjs", scripts: { start: "node bin/app.mjs" } },
      root,
      inspectFile,
    ),
  ).toBe(true);
  expect(
    hasApplicationEntrypoint(
      { bin: { app: "bin/app.mjs" }, scripts: { start: "node src/app.mjs" } },
      root,
      inspectFile,
    ),
  ).toBe(false);
});

test("validates each declared entrypoint independently", () => {
  const inspectFile = (path) => path === "/repo/bin/valid.mjs";
  expect(
    hasApplicationEntrypoint(
      { main: "", bin: { app: "bin/valid.mjs" }, scripts: { start: "node server.mjs" } },
      "/repo",
      inspectFile,
    ),
  ).toBe(false);
  expect(
    hasApplicationEntrypoint(
      { main: "bin/valid.mjs", bin: "", scripts: { start: "node server.mjs" } },
      "/repo",
      inspectFile,
    ),
  ).toBe(false);
});
