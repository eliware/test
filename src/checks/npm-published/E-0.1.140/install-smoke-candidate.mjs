import { readFile, rm } from "node:fs/promises";
import { join } from "node:path";

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
}) {
  await rm(join(targetRoot, "node_modules", ...packageJson.name.split("/")), {
    recursive: true,
    force: true,
  });
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
  if (installed.version !== packageJson.version)
    throw new Error(
      `Installed package version ${installed.version} does not match ${packageJson.version}.`,
    );
  const tested = await run(command, [...prefix, "test"], {
    cwd: targetRoot,
    env: { ...env, ELIWARE_TEST_SMOKE_CANDIDATE: packageJson.name },
  });
  if (tested.code !== 0) throw new Error(commandFailure(tested, "Consumer npm test failed"));
}
