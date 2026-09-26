import { expect, jest, test } from "@jest/globals";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolveMailboxTemplateFiles } from "../../../../src/checks/general/E-0.1/resolve-mailbox-template-files.mjs";

test("uses tracked files when available and filters ignored repository files otherwise", async () => {
  const checkIgnored = jest.fn(async (_root, file) => file === "ignored.env");
  await expect(
    resolveMailboxTemplateFiles(
      "/repo",
      [".env.example", "ignored.env"],
      ["tracked.env"],
      checkIgnored,
    ),
  ).resolves.toEqual(["tracked.env"]);
  await expect(
    resolveMailboxTemplateFiles("/repo", [".env.example", "ignored.env"], undefined, checkIgnored),
  ).resolves.toEqual([".env.example"]);
  expect(checkIgnored).toHaveBeenCalledWith("/repo", "ignored.env");
});

test("uses git ignore lookup when no override is provided", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-mailbox-templates-"));
  await expect(resolveMailboxTemplateFiles(root, [".env.example"], undefined)).resolves.toEqual([
    ".env.example",
  ]);
  await rm(root, { recursive: true, force: true });
});
