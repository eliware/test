import { join } from "node:path";

export async function regenerateLockfileInWorkspace({
  temporary,
  packageJson,
  currentLockfile,
  write,
  read,
  getNpmCommand,
  runCommand,
}) {
  await write(join(temporary, "package.json"), `${JSON.stringify(packageJson)}\n`);
  await write(join(temporary, "package-lock.json"), `${JSON.stringify(currentLockfile)}\n`);
  const [command, prefix] = getNpmCommand();
  const result = await runCommand(command, [
    ...prefix,
    "install",
    "--package-lock-only",
    "--ignore-scripts",
    "--no-audit",
    "--no-fund",
    "--offline",
  ], temporary);
  if (result.code !== 0) {
    throw new Error(`npm could not regenerate package-lock.json: ${result.stderr.trim()}`);
  }
  return JSON.parse(await read(join(temporary, "package-lock.json"), "utf8"));
}
