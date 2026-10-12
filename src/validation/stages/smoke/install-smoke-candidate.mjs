import { lstat, readFile, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import { resolve as resolvePath } from "node:path";
import { assertSmokePackageParents } from "./assert-smoke-package-parents.mjs";

function commandFailure(result, label) {
  const detail = [result?.stdout, result?.stderr].filter(Boolean).join("\n").trim();
  return label + (detail ? ": " + detail : ".");
}

export async function installSmokeCandidate({
  targetRoot,
  packageJson,
  tarball,
  run,
  command,
  prefix,
  env,
  inspect = lstat,
  resolveModule = (specifier, parent) => createRequire(parent).resolve(specifier),
}) {
  await assertSmokePackageParents(targetRoot, packageJson.name, inspect);
  await rm(join(targetRoot, "node_modules", ...packageJson.name.split("/")), {
    recursive: true,
    force: true,
  });
  await assertSmokePackageParents(targetRoot, packageJson.name, inspect);
  const install = await run(
    command,
    [
      ...prefix,
      "install",
      "--ignore-scripts",
      "--no-save",
      "--package-lock=false",
      "--no-audit",
      "--no-fund",
      tarball,
    ],
    { cwd: targetRoot, env },
  );
  if (install.code !== 0) throw new Error(commandFailure(install, "Tarball installation failed"));
  const installedPath = join(
    targetRoot,
    "node_modules",
    ...packageJson.name.split("/"),
    "package.json",
  );
  const installed = JSON.parse(await readFile(installedPath, "utf8"));
  if (installed.name !== packageJson.name)
    throw new Error(`Installed package ${installed.name} does not match ${packageJson.name}.`);
  if (installed.version !== packageJson.version)
    throw new Error(
      `Installed package version ${installed.version} does not match ${packageJson.version}.`,
    );
  const binTarget =
    typeof packageJson.bin === "string" ? packageJson.bin : Object.values(packageJson.bin ?? {})[0];
  if (typeof binTarget === "string") {
    const relativeBinTarget = binTarget.replace(/^\.\//u, "");
    const expectedBin = join(
      targetRoot,
      "node_modules",
      ...packageJson.name.split("/"),
      relativeBinTarget,
    );
    const resolvedBin = resolveModule(expectedBin, join(targetRoot, "package.json"));
    if (resolvePath(resolvedBin) !== resolvePath(expectedBin))
      throw new Error("Consumer does not resolve the installed smoke package CLI entrypoint.");
  }
  const tested = await run(command, [...prefix, "test"], {
    cwd: targetRoot,
    env: { ...env, ELIWARE_TEST_SMOKE_CANDIDATE: packageJson.name },
  });
  if (tested.code !== 0) throw new Error(commandFailure(tested, "Consumer npm test failed"));
}
