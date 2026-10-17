import { dirname } from "node:path";

export async function restoreCapturedSmokePath(entry, fs) {
  await removeCapturedPath(entry.path, fs);
  if (entry.type === "missing") return;
  await fs.mkdir(dirname(entry.path), { recursive: true });

  if (entry.type === "symlink") await fs.symlink(entry.target, entry.path, entry.linkType);
  if (entry.type === "file") {
    await fs.writeFile(entry.path, entry.data);
    await fs.chmod(entry.path, entry.mode);
  }
  if (entry.type === "directory")
    await fs.cp(entry.backup, entry.path, { recursive: true, verbatimSymlinks: true });
}

async function removeCapturedPath(path, fs) {
  let metadata;
  try {
    metadata = await fs.lstat(path);
  } catch (error) {
    if (error.code === "ENOENT") return;
    throw error;
  }
  if (metadata.isSymbolicLink()) await fs.unlink(path);
  else await fs.rm(path, { recursive: metadata.isDirectory(), force: true });
}
