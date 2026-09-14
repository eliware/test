import { spawnSync } from "node:child_process";

for (const [command, args] of [
  ["git", ["pull", "--ff-only", "origin", "main"]],
  ["npm", ["ci"]],
  ["npm", ["test"]],
]) {
  const result = spawnSync(command, args, { cwd: process.cwd(), stdio: "inherit", shell: false });
  if ((result.status ?? 1) !== 0) {
    process.exitCode = result.status ?? 1;
    break;
  }
}
