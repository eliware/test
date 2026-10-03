import { cp, lstat, mkdtemp, readFile, readlink, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const defaultFs = { cp, lstat, readFile, readlink, rm, stat };

async function capturePath(path, storage, fs) {
  try {
    const info = await fs.lstat(path);
    if (info.isSymbolicLink()) {
      let linkType = "file";
      try {
        if ((await fs.stat(path)).isDirectory()) linkType = "junction";
      } catch {
        // Preserve broken links as file symlinks where the platform allows them.
      }
      return { path, type: "symlink", target: await fs.readlink(path), linkType };
    }
    if (info.isDirectory()) {
      const backup = join(storage, `${Math.random().toString(16).slice(2)}-directory`);
      await fs.cp(path, backup, { recursive: true, verbatimSymlinks: true });
      return { path, type: "directory", backup };
    }
    if (info.isFile())
      return { path, type: "file", data: await fs.readFile(path), mode: info.mode };
    throw new Error(`Cannot safely preserve unsupported target path: ${path}`);
  } catch (error) {
    if (error.code === "ENOENT") return { path, type: "missing" };
    throw error;
  }
}

export async function captureSmokeTargetState(root, packageName, binNames = [], fs = defaultFs) {
  const storage = await mkdtemp(join(tmpdir(), "eliware-smoke-backup-"));
  const packagePath = join(root, "node_modules", ...packageName.split("/"));
  const paths = [
    join(root, "package.json"),
    join(root, "package-lock.json"),
    join(root, "npm-shrinkwrap.json"),
    join(root, "node_modules", ".package-lock.json"),
    packagePath,
    dirname(packagePath),
    join(root, "node_modules", ".bin"),
    ...binNames.flatMap((name) =>
      ["", ".cmd", ".ps1"].map((suffix) => join(root, "node_modules", ".bin", `${name}${suffix}`)),
    ),
  ];
  try {
    const entries = [];
    for (const path of new Set(paths)) entries.push(await capturePath(path, storage, fs));
    return { entries, storage };
  } catch (error) {
    try {
      await fs.rm(storage, { recursive: true, force: true });
    } catch (cleanupError) {
      throw new Error(
        `Failed to capture smoke target state (${error.message}); temporary backup may remain at ${storage}: ${cleanupError.message}`,
        { cause: error },
      );
    }
    throw error;
  }
}
