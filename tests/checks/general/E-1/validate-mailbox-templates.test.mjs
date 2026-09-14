import { expect, test } from "@jest/globals";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateMailboxTemplates } from "../../../../src/checks/general/E-1/validate-mailbox-templates.mjs";

test("rejects owner declarations in templates and accepts other templates", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-mailbox-template-"));
  await writeFile(join(root, ".env.example"), "MAIL_OWNER_ADDRESS=fixture@eliware.org\n");
  await expect(validateMailboxTemplates(root, [".env.example"])).resolves.toContain("must not define");
  await writeFile(join(root, ".env.example"), "OTHER=value\n");
  await expect(validateMailboxTemplates(root, [".env", ".env.example"])).resolves.toBeNull();
  await rm(root, { recursive: true, force: true });
});

test("reports unreadable templates", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-mailbox-template-"));
  await expect(validateMailboxTemplates(root, [".env.local"])).resolves.toContain("could not be inspected");
  await rm(root, { recursive: true, force: true });
});
