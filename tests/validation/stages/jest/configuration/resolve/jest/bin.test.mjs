import { beforeEach, expect, jest, test } from "@jest/globals";
import { dirname, join } from "node:path";

const readFileSync = jest.fn();
const realpathSync = jest.fn();
const statSync = jest.fn();
jest.unstable_mockModule("node:fs", () => ({ readFileSync, realpathSync, statSync }));

const { resolveJestBin } =
  await import("../../../../../../../src/validation/stages/jest/configuration/resolve/jest/bin.mjs");

const packagePath = "C:/consumer/node_modules/jest/package.json";
const packageRoot = dirname(packagePath);
const exportedBin = join(packageRoot, "bin", "jest.js");

function resolver({ binPath = exportedBin, missing = false } = {}) {
  return {
    resolve: jest.fn((specifier) => {
      if (specifier === "jest" && missing) {
        throw Object.assign(new Error("Cannot find module 'jest'"), { code: "MODULE_NOT_FOUND" });
      }
      if (specifier === "jest") return packagePath;
      if (specifier === "jest/bin/jest") {
        if (binPath instanceof Error) throw binPath;
        return binPath;
      }
      if (specifier === "jest/package.json") return packagePath;
      throw new Error(`Unexpected package request: ${specifier}`);
    }),
  };
}

beforeEach(() => {
  readFileSync.mockReset().mockReturnValue(JSON.stringify({ bin: { jest: "bin/jest.js" } }));
  realpathSync.mockReset().mockImplementation((path) => path);
  statSync.mockReset().mockReturnValue({ isFile: () => true });
});

test("resolves an exported Jest executable", () => {
  expect(resolveJestBin(resolver(), "jest")).toBe(exportedBin);
  expect(statSync).toHaveBeenCalledWith(exportedBin);
});

test("returns no path for a missing package", () => {
  expect(resolveJestBin(resolver({ missing: true }), "jest")).toBeUndefined();
});

test("rejects malformed or missing executable metadata", () => {
  const requireFromConsumer = resolver({ binPath: new Error("not exported") });
  readFileSync.mockReturnValueOnce("{");
  expect(() => resolveJestBin(requireFromConsumer, "jest")).toThrow(SyntaxError);
  readFileSync.mockReturnValueOnce(JSON.stringify({ name: "jest" }));
  expect(() => resolveJestBin(requireFromConsumer, "jest")).toThrow(
    "does not declare a Jest executable",
  );
});

test("rejects a declared executable that does not exist", () => {
  readFileSync.mockReturnValue(JSON.stringify({ bin: { jest: "missing.mjs" } }));
  statSync.mockReturnValue({ isFile: () => false });
  expect(() => resolveJestBin(resolver({ binPath: new Error("not exported") }), "jest")).toThrow(
    "does not exist",
  );
});

test("rejects exported executables that resolve outside the Jest package", () => {
  realpathSync.mockImplementation((path) =>
    path === exportedBin ? "C:/outside/runner.mjs" : path,
  );
  expect(() => resolveJestBin(resolver(), "jest")).toThrow("escapes its package directory");
});

test("rejects fallback executables that resolve outside the Jest package", () => {
  const runner = join(packageRoot, "bin", "jest.js");
  realpathSync.mockImplementation((path) => (path === runner ? "C:/outside/runner.mjs" : path));
  expect(() => resolveJestBin(resolver({ binPath: new Error("not exported") }), "jest")).toThrow(
    "escapes its package directory",
  );
});

test("rejects a fallback when resolving its real path fails", () => {
  realpathSync.mockImplementation((path) => {
    if (path.endsWith("bin\\jest.js")) throw new Error("unavailable");
    return path;
  });
  expect(() => resolveJestBin(resolver({ binPath: new Error("not exported") }), "jest")).toThrow(
    "does not exist",
  );
});

test("rejects declared executables that escape the package directory", () => {
  readFileSync.mockReturnValue(JSON.stringify({ bin: { jest: "../../outside.mjs" } }));
  expect(() => resolveJestBin(resolver({ binPath: new Error("not exported") }), "jest")).toThrow(
    "escapes its package directory",
  );
});

test("rejects an exported executable when its package path resolves outside", () => {
  realpathSync.mockImplementation((path) => (path === packageRoot ? "C:/outside/jest" : path));
  expect(() => resolveJestBin(resolver(), "jest")).toThrow("escapes its package directory");
});

test("rejects an empty declared executable path", () => {
  readFileSync.mockReturnValue(JSON.stringify({ bin: "" }));
  expect(() => resolveJestBin(resolver({ binPath: new Error("not exported") }), "jest")).toThrow(
    "does not declare a Jest executable",
  );
});

test("uses metadata when the exported path is a directory", () => {
  const runner = join(packageRoot, "commands", "runner.mjs");
  readFileSync.mockReturnValue(JSON.stringify({ bin: { jest: "commands/runner.mjs" } }));
  statSync.mockImplementation((path) => ({ isFile: () => path === runner }));
  expect(resolveJestBin(resolver(), "jest")).toBe(runner);
});

test("rejects a declared executable path that points to a directory", () => {
  readFileSync.mockReturnValue(JSON.stringify({ bin: { jest: "commands" } }));
  statSync.mockReturnValue({ isFile: () => false });
  expect(() => resolveJestBin(resolver({ binPath: new Error("not exported") }), "jest")).toThrow(
    "does not exist",
  );
});

test("rethrows unexpected package resolution errors", () => {
  const error = new Error("resolver failure");
  expect(() =>
    resolveJestBin(
      {
        resolve: () => {
          throw error;
        },
      },
      "jest",
    ),
  ).toThrow(error);
});
