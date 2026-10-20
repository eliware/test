import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { assertSmokeCliEntrypoint } from "./assert-smoke-cli-entrypoint.mjs";

export async function validateInstalledSmokePackage({
  targetRoot,
  packageJson,
  resolveModule,
  read = readFile,
}) {
  const installedPath = join(
    targetRoot,
    "node_modules",
    ...packageJson.name.split("/"),
    "package.json",
  );
  const installed = JSON.parse(await read(installedPath, "utf8"));
  if (installed.name !== packageJson.name)
    throw new Error(`Installed package ${installed.name} does not match ${packageJson.name}.`);
  if (installed.version !== packageJson.version)
    throw new Error(
      `Installed package version ${installed.version} does not match ${packageJson.version}.`,
    );
  assertSmokeCliEntrypoint({ targetRoot, packageJson, resolveModule });
}
