import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { readTrackedPaths } from "./E-1.6/read-tracked-paths.mjs";
import { validateMailboxOwner } from "./validate-mailbox-owner.mjs";
import { isIgnoredByGit } from "./check-git-ignore.mjs";

export async function inspectLocalMailboxOwner(
  root,
  expected,
  { trackedFiles, readTracked = readTrackedPaths, checkIgnored = isIgnoredByGit } = {},
) {
  let localEnvironment;
  try {
    localEnvironment = await readFile(join(root, ".env"), "utf8");
  } catch {
    return { error: `Local .env must define the mailbox owner as ${expected}.` };
  }
  if (!validateMailboxOwner(localEnvironment, expected))
    return { error: `Local .env must define the mailbox owner as ${expected}.` };
  const gitTracked = trackedFiles ?? await readTracked(root);
  if (!Array.isArray(gitTracked))
    return { error: "Git tracking inspection was unavailable; cannot validate the local mailbox owner safely." };
  if (new Set(gitTracked).has(".env"))
    return { error: "The local mailbox owner file .env must remain untracked." };
  if (!(await checkIgnored(root, ".env")))
    return { error: "The local mailbox owner file .env must be ignored by Git." };
  return { trackedFiles: gitTracked, error: null };
}
