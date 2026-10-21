import { join } from "node:path";

export async function captureSmokeDirectory(path, storage, fs) {
  const backup = join(storage, `${Math.random().toString(16).slice(2)}-directory`);
  await fs.cp(path, backup, { recursive: true, verbatimSymlinks: true });
  return { path, type: "directory", backup };
}
