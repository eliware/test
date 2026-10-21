import { expect, jest, test } from "@jest/globals";
import { dirname, join } from "node:path";
import { captureSmokeDirectory } from "../../../../../src/validation/stages/smoke/capture-smoke/directory.mjs";

test("copies a directory into the supplied smoke backup storage", async () => {
  const fs = { cp: jest.fn(async () => {}) };
  const result = await captureSmokeDirectory("C:/consumer/package", "C:/smoke/backup", fs);
  expect(result).toMatchObject({ path: "C:/consumer/package", type: "directory" });
  expect(dirname(result.backup)).toBe(join("C:/smoke/backup"));
  expect(result.backup.endsWith("-directory")).toBe(true);
  expect(fs.cp).toHaveBeenCalledWith("C:/consumer/package", result.backup, {
    recursive: true,
    verbatimSymlinks: true,
  });
});

test("propagates directory copy failures", async () => {
  await expect(
    captureSmokeDirectory("package", "backup", {
      cp: async () => {
        throw new Error("denied");
      },
    }),
  ).rejects.toThrow("denied");
});
