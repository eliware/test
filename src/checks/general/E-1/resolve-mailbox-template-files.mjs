export async function resolveMailboxTemplateFiles(files, trackedFiles, checkIgnored) {
  if (Array.isArray(trackedFiles)) return trackedFiles;
  return (await Promise.all(
    files.map(async (file) => (await checkIgnored(file) ? null : file)),
  )).filter(Boolean);
}
