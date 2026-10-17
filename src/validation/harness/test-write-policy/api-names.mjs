export const fileMutationApis = new Set([
  "appendFile",
  "appendFileSync",
  "copyFile",
  "copyFileSync",
  "createWriteStream",
  "link",
  "linkSync",
  "mkdir",
  "mkdirSync",
  "mkdtemp",
  "mkdtempSync",
  "open",
  "openSync",
  "rename",
  "renameSync",
  "rm",
  "rmSync",
  "rmdir",
  "rmdirSync",
  "symlink",
  "symlinkSync",
  "truncate",
  "truncateSync",
  "unlink",
  "unlinkSync",
  "write",
  "writeFile",
  "writeFileSync",
]);

export const temporaryDirectoryApis = new Set(["tmpdir", "tmpdirSync"]);
export const filesystemModules = new Set(["fs", "node:fs", "fs/promises", "node:fs/promises"]);
export const temporaryDirectoryModules = new Set(["os", "node:os"]);
export const restrictedModules = new Set([...filesystemModules, ...temporaryDirectoryModules]);
