import { expect, jest, test } from "@jest/globals";
import { cleanupFailedSmokeCapture } from "../../../../../src/validation/stages/smoke/capture-smoke/cleanup-failed-capture.mjs";

test("removes the partial backup and rethrows the capture error", async () => {
  const error = new Error("copy denied");
  const fs = { rm: jest.fn(async () => {}) };
  await expect(cleanupFailedSmokeCapture("C:/smoke/backup", fs, error)).rejects.toBe(error);
  expect(fs.rm).toHaveBeenCalledWith("C:/smoke/backup", { recursive: true, force: true });
});

test("reports the backup path when cleanup fails", async () => {
  const error = new Error("copy denied");
  const fs = {
    rm: jest.fn(async () => {
      throw new Error("cleanup denied");
    }),
  };
  await expect(cleanupFailedSmokeCapture("C:/smoke/backup", fs, error)).rejects.toMatchObject({
    message: expect.stringContaining(
      "Temporary backup may remain at C:/smoke/backup: cleanup denied",
    ),
    cause: error,
  });
});
