import { isIgnoredByGit } from "./check-git-ignore.mjs";

export async function resolveMailboxTemplateFiles(
  root,
  files,
  trackedFiles,
  checkIgnored = isIgnoredByGit,
) {
  if (Array.isArray(trackedFiles)) return trackedFiles;
  return (
    await Promise.all(files.map(async (file) => ((await checkIgnored(root, file)) ? null : file)))
  ).filter(Boolean);
}
