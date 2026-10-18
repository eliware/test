import { beforeEach, expect, jest, test } from "@jest/globals";
import { join } from "node:path";
const lstat = jest.fn();
const rm = jest.fn();

jest.unstable_mockModule("node:fs/promises", () => ({ lstat, rm }));

const { prepareSmokeTarget } =
  await import("../../../../../src/validation/stages/smoke/prepare-smoke/target.mjs");

const root = "C:/consumer";

beforeEach(() => {
  lstat.mockReset().mockResolvedValue({ isDirectory: () => true, isSymbolicLink: () => false });
  rm.mockReset().mockResolvedValue(undefined);
});

test("removes the installed package without changing consumer manifests or lockfiles", async () => {
  const installed = join(root, "node_modules", "@eliware", "test");

  await prepareSmokeTarget({ targetRoot: root, packageName: "@eliware/test" });

  expect(rm).toHaveBeenCalledWith(installed, { recursive: true, force: true });
  expect(rm).toHaveBeenCalledTimes(1);
});
