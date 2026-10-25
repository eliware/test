import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function verifySmokeTargetInstallation(targetRoot, packageName, read = readFile) {
  await read(join(targetRoot, "node_modules", ".package-lock.json"));
  await read(join(targetRoot, "node_modules", ...packageName.split("/"), "package.json"));
}
