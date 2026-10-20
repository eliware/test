import { expect, test, jest } from "@jest/globals";
import { join } from "node:path";

const resolve = jest.fn();
const createRequire = jest.fn(() => ({ resolve }));
jest.unstable_mockModule("node:module", () => ({ createRequire }));
const { assertSmokeCliEntrypoint } =
  await import("../../../../../src/validation/stages/smoke/install-smoke-candidate/assert-smoke-cli-entrypoint.mjs");

const targetRoot = "C:/consumer";
const packageJson = { name: "@eliware/test", bin: "bin/eliware-test.mjs" };
const expected = join(targetRoot, "node_modules", "@eliware", "test", "bin", "eliware-test.mjs");

test.each([
  ["string entry", "bin/eliware-test.mjs"],
  ["mapped entry", { "eliware-test": "bin/eliware-test.mjs" }],
])("resolves a %s", (_label, bin) => {
  const resolveModule = jest.fn(() => expected);
  expect(() =>
    assertSmokeCliEntrypoint({ targetRoot, packageJson: { ...packageJson, bin }, resolveModule }),
  ).not.toThrow();
  expect(resolveModule).toHaveBeenCalledWith(expected, join(targetRoot, "package.json"));
});

test("does not resolve packages without a bin entry", () => {
  const resolveModule = jest.fn();
  assertSmokeCliEntrypoint({
    targetRoot,
    packageJson: { ...packageJson, bin: undefined },
    resolveModule,
  });
  expect(resolveModule).not.toHaveBeenCalled();
});

test("uses the default module resolver", () => {
  resolve.mockReturnValue(expected);
  assertSmokeCliEntrypoint({ targetRoot, packageJson });

  expect(createRequire).toHaveBeenCalledWith(join(targetRoot, "package.json"));
  expect(resolve).toHaveBeenCalledWith(expected);
});

test("rejects a CLI entrypoint outside the installed package", () => {
  expect(() =>
    assertSmokeCliEntrypoint({
      targetRoot,
      packageJson,
      resolveModule: () => join(targetRoot, "other-package", "bin", "eliware-test.mjs"),
    }),
  ).toThrow("Consumer does not resolve the installed smoke package CLI entrypoint.");
});
