import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { validateMailboxOwner } from "./validate-mailbox-owner.mjs";
import { isIgnoredByRepositoryRules } from "./check-repository-ignore.mjs";

export async function inspectLocalMailboxOwner(
  root,
  expected,
  { checkIgnored = isIgnoredByRepositoryRules } = {},
) {
  let localEnvironment;
  try {
    localEnvironment = await readFile(join(root, ".env"), "utf8");
  } catch {
    return { error: `Local .env must define the mailbox owner as ${expected}.` };
  }
  if (!validateMailboxOwner(localEnvironment, expected))
    return { error: `Local .env must define the mailbox owner as ${expected}.` };
  if (!(await checkIgnored(root, ".env")))
    return {
      error: "The local mailbox owner file .env must be ignored by the repository's .gitignore.",
    };
  return { error: null };
}
