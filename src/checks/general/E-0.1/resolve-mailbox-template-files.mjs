import { isIgnoredByRepositoryRules } from "./check-repository-ignore.mjs";

export async function resolveMailboxTemplateFiles(
  root,
  files,
  checkIgnored = isIgnoredByRepositoryRules,
) {
  return (
    await Promise.all(files.map(async (file) => ((await checkIgnored(root, file)) ? null : file)))
  ).filter(Boolean);
}
