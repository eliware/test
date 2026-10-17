import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runSmokeCli } from "../cli.mjs";

export async function runSmokeCliEntrypoint({ moduleUrl, argvPath, args, run = runSmokeCli }) {
  if (resolve(fileURLToPath(moduleUrl)) !== resolve(argvPath ?? "")) return;
  process.exitCode = await run({ args });
}

await runSmokeCliEntrypoint({
  moduleUrl: import.meta.url,
  argvPath: process.argv[1],
  args: process.argv.slice(2),
});
