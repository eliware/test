import { expect, jest, test } from "@jest/globals";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolveMailboxTemplateFiles } from "../../../../src/checks/general/E-0.1/resolve-mailbox-template-files.mjs";

test("filters current repository files using local ignore rules", async () => {
  const checkIgnored = jest.fn(async (_root, file) => file === "ignored.env");
  await expect(
    resolveMailboxTemplateFiles("/repo", [".env.example", "ignored.env"], checkIgnored),
  ).resolves.toEqual([".env.example"]);
  await expect(
    resolveMailboxTemplateFiles("/repo", [".env.example", "ignored.env"], checkIgnored),
  ).resolves.toEqual([".env.example"]);
  expect(checkIgnored).toHaveBeenCalledWith("/repo", "ignored.env");
});

test("uses repository ignore rules when no override is provided", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-mailbox-templates-"));
  await expect(resolveMailboxTemplateFiles(root, [".env.example"])).resolves.toEqual([
    ".env.example",
  ]);
  await rm(root, { recursive: true, force: true });
});
