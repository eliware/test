import { readFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runNpmConsumerSmoke } from "./run-npm-consumer-smoke.mjs";

export async function runSmokeCli({
  args,
  root = process.cwd(),
  write = console.log,
  smoke = runNpmConsumerSmoke,
}) {
  if (!Array.isArray(args) || args.length !== 2 || args[0] !== "--target" || !args[1]) {
    write("Usage: npm run smoke -- --target <existing-consumer-path>");
    return 18;
  }
  try {
    const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
    const result = await smoke({ root, packageJson, target: args[1], write });
    write(result);
    return result.startsWith("Smoke passed:") ? 0 : 17;
  } catch (error) {
    write(`Tarball consumer smoke failed: ${error.message}`);
    return 17;
  }
}

export async function runSmokeCliEntrypoint({ moduleUrl, argvPath, args, run = runSmokeCli }) {
  if (resolve(fileURLToPath(moduleUrl)) !== resolve(argvPath ?? "")) return;
  process.exitCode = await run({ args });
}

await runSmokeCliEntrypoint({
  moduleUrl: import.meta.url,
  argvPath: process.argv[1],
  args: process.argv.slice(2),
});
