import { expect, jest, test } from "@jest/globals";
import { dirname, join, resolve } from "node:path";
const readFileSync = jest.fn();
const realpathSync = jest.fn((path) => path);
const statSync = jest.fn(() => ({ isFile: () => true }));
jest.unstable_mockModule("node:fs", () => ({ readFileSync, realpathSync, statSync }));
const resolveMetadataJestBin = (
  await import("../../../../../../../../src/validation/stages/jest/configuration/resolve/jest/resolve/metadata-bin.mjs")
).default;
test("resolves and validates the executable declared in package metadata", () => {
  const packagePath = join(resolve("consumer"), "node_modules", "jest", "package.json");
  readFileSync.mockReturnValue(JSON.stringify({ bin: { jest: "bin/jest.js" } }));
  const requireFromConsumer = { resolve: () => packagePath };
  expect(resolveMetadataJestBin(requireFromConsumer, "jest", realpathSync)).toBe(
    join(dirname(packagePath), "bin", "jest.js"),
  );
});
