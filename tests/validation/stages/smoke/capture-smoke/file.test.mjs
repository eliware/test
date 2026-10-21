import { expect, jest, test } from "@jest/globals";
import { captureSmokeFile } from "../../../../../src/validation/stages/smoke/capture-smoke/file.mjs";

test("captures file bytes and mode", async () => {
  const data = Buffer.from("data");
  const fs = { readFile: jest.fn(async () => data) };
  await expect(captureSmokeFile("package.json", { mode: 420 }, fs)).resolves.toEqual({
    path: "package.json",
    type: "file",
    data,
    mode: 420,
  });
  expect(fs.readFile).toHaveBeenCalledWith("package.json");
});
test("propagates file read failures", async () => {
  await expect(
    captureSmokeFile(
      "package.json",
      { mode: 420 },
      {
        readFile: async () => {
          throw new Error("denied");
        },
      },
    ),
  ).rejects.toThrow("denied");
});
