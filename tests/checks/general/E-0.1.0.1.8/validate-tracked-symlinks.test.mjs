import { expect, test } from "@jest/globals";
import { validateTrackedSymlinks } from "../../../../src/checks/general/E-0.1.0.1.8/validate-tracked-symlinks.mjs";

test("accepts an index without tracked symlinks", async () => {
  await expect(
    validateTrackedSymlinks("repo", async () => ({ stdout: Buffer.from("") })),
  ).resolves.toEqual([]);
});

test("reports tracked symlink index entries", async () => {
  const output = `120000 ${"a".repeat(40)} 0\tlink\0`;
  await expect(
    validateTrackedSymlinks("repo", async () => ({ stdout: Buffer.from(output) })),
  ).resolves.toEqual(["Tracked symlink entries are prohibited: link."]);
});

test("reports Git and index parse failures", async () => {
  await expect(
    validateTrackedSymlinks("repo", async () => Promise.reject(new Error("failed"))),
  ).resolves.toEqual(["Git index status could not be read; tracked symlinks are unknown."]);
  await expect(
    validateTrackedSymlinks("repo", async () => ({ stdout: Buffer.from("invalid\0") })),
  ).resolves.toEqual(["Git index status could not be read; tracked symlinks are unknown."]);
});
