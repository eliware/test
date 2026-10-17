import { expect, test } from "@jest/globals";
import { validateTrackedIgnoredPaths } from "../../../../../../../src/checks/general/E-0.1.0.1.8/validate/git/ignore/tracked-ignored-paths.mjs";

test("reports tracked paths that match ignore rules", async () => {
  await expect(
    validateTrackedIgnoredPaths("repo", async () => ({ stdout: Buffer.from("tracked-output\0") })),
  ).resolves.toEqual(["Tracked or staged paths match ignore rules: tracked-output."]);
});

test("returns no finding when tracked paths do not match ignore rules", async () => {
  await expect(
    validateTrackedIgnoredPaths("repo", async () => ({ stdout: Buffer.from("") })),
  ).resolves.toEqual([]);
});

test("reports command and malformed output failures", async () => {
  await expect(
    validateTrackedIgnoredPaths("repo", async () => {
      throw new Error("Git failed");
    }),
  ).resolves.toEqual(["Git index status could not be read. Tracked ignore status is unknown."]);
  await expect(
    validateTrackedIgnoredPaths("repo", async () => ({ stdout: Buffer.from("bad") })),
  ).resolves.toEqual(["Git index status could not be read. Tracked ignore status is unknown."]);
});
