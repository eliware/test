import { runNpmConsumerSmoke } from "./run/npm-consumer-smoke.mjs";
import { readSmokePackageJson } from "./cli/read-package-json.mjs";
import { validateSmokeCliArguments } from "./cli/arguments.mjs";

export async function runSmokeCli({
  args,
  root = process.cwd(),
  write = console.log,
  smoke = runNpmConsumerSmoke,
}) {
  const argumentsResult = validateSmokeCliArguments(args);
  if (argumentsResult.error) {
    write(argumentsResult.error);
    return 18;
  }
  try {
    const packageJson = await readSmokePackageJson(root);
    const result = await smoke({ root, packageJson, target: argumentsResult.target, write });
    write(result);
    return result.startsWith("Smoke passed:") ? 0 : 17;
  } catch (error) {
    write(`Tarball consumer smoke failed: ${error.message}`);
    return 17;
  }
}
