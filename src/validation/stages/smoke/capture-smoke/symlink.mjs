export async function captureSmokeSymlink(path, fs, platform) {
  let linkType = "file";
  try {
    if ((await fs.stat(path)).isDirectory()) linkType = "junction";
  } catch {}
  if (platform === "win32" && linkType === "file")
    throw new Error(`Cannot safely preserve a Windows file symlink at ${path}.`);
  return { path, type: "symlink", target: await fs.readlink(path), linkType };
}
