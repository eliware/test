import { runNpmConsumerSmoke } from "./run/npm-consumer-smoke.mjs";
import { readSmokePackageJson } from "./cli/read-package-json.mjs";

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
    const packageJson = await readSmokePackageJson(root);
    const result = await smoke({ root, packageJson, target: args[1], write });
    write(result);
    return result.startsWith("Smoke passed:") ? 0 : 17;
  } catch (error) {
    write(`Tarball consumer smoke failed: ${error.message}`);
    return 17;
  }
}
