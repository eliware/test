import { expect, jest, test } from "@jest/globals";
import { resolveMailboxTemplateFiles } from "../../../../src/checks/general/E-1/resolve-mailbox-template-files.mjs";

test("uses tracked files when available and filters ignored repository files otherwise", async () => {
  const checkIgnored = jest.fn(async (file) => file === "ignored.env");
  await expect(resolveMailboxTemplateFiles([".env.example", "ignored.env"], ["tracked.env"], checkIgnored))
    .resolves.toEqual(["tracked.env"]);
  await expect(resolveMailboxTemplateFiles([".env.example", "ignored.env"], undefined, checkIgnored))
    .resolves.toEqual([".env.example"]);
  expect(checkIgnored).toHaveBeenCalledWith("ignored.env");
});
