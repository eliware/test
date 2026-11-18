import { expect, jest, test } from "@jest/globals";
import captureSmokeEntries from "../../../../../src/validation/stages/smoke/capture-smoke/capture-entries.mjs";

test("requires backup storage inside the smoke workspace", async () => {
  await expect(
    captureSmokeEntries("C:/consumer", "@eliware/test", [], {}, process.platform),
  ).rejects.toThrow("Smoke state storage must be inside the smoke workspace.");
});

test("cleans failed path captures and returns the original error", async () => {
  const failure = new Error("read denied");
  const fs = {
    lstat: jest.fn(async () => {
      throw failure;
    }),
    rm: jest.fn(async () => {}),
  };

  await expect(
    captureSmokeEntries(
      "C:/consumer",
      "@eliware/test",
      [],
      fs,
      process.platform,
      "C:/smoke/backup",
      async () => {},
    ),
  ).rejects.toBe(failure);
  expect(fs.rm).toHaveBeenCalledWith("C:/smoke/backup", {
    recursive: true,
    force: true,
  });
});
