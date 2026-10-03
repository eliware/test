import { expect, test } from "@jest/globals";
import { run } from "../../../../../src/checks/general/E-0.1/E-0.1.29/A-0.1.29.0.mjs";

test("passes when the Git index contains no tracked symlink entries", async () => {
  await expect(run({ root: "/repo", readSymlinks: async () => [] })).resolves.toMatchObject({
    status: "pass",
  });
});

test("reports every tracked symlink entry", async () => {
  await expect(
    run({ root: "/repo", readSymlinks: async () => ["file-link", "directory-link"] }),
  ).resolves.toMatchObject({
    status: "fail",
    message: expect.stringContaining("file-link, directory-link"),
  });
});

test("fails closed when Git index inspection is unavailable", async () => {
  await expect(run({ root: "/repo", readSymlinks: async () => null })).resolves.toMatchObject({
    status: "fail",
    message: expect.stringContaining("Git index inspection was unavailable"),
  });
});

test("uses Git index inspection by default", async () => {
  await expect(run({ root: process.cwd(), readSymlinks: undefined })).resolves.toMatchObject({
    status: "pass",
  });
});
