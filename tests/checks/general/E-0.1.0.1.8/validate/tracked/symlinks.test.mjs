import { expect, test } from "@jest/globals";
import { validateTrackedSymlinks } from "../../../../../../src/checks/general/E-0.1.0.1.8/validate/tracked/symlinks.mjs";

test("skips exempt tracked symlinks and still reports other paths", async () => {
  const output = ["exempt-link", "blocked-link"]
    .map((path) => `120000 ${"a".repeat(40)} 0\t${path}\0`)
    .join("");
  const isPathExempt = (path) => path === "exempt-link";

  await expect(
    validateTrackedSymlinks("repo", async () => ({ stdout: Buffer.from(output) }), isPathExempt),
  ).resolves.toEqual(["Tracked symlink entries are prohibited: blocked-link."]);
  await expect(
    validateTrackedSymlinks(
      "repo",
      async () => ({ stdout: Buffer.from(output) }),
      () => true,
    ),
  ).resolves.toEqual([]);
});

test("reports Git and index parse failures", async () => {
  await expect(
    validateTrackedSymlinks("repo", async () => Promise.reject(new Error("failed"))),
  ).resolves.toEqual(["Git index status could not be read. Tracked symlinks are unknown."]);
  await expect(
    validateTrackedSymlinks("repo", async () => ({ stdout: Buffer.from("invalid\0") })),
  ).resolves.toEqual(["Git index status could not be read. Tracked symlinks are unknown."]);
});
