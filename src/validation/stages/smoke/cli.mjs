import { runSmokeCommand } from "./cli/command.mjs";
import { validateSmokeCliArguments } from "./cli/arguments.mjs";

export async function runSmokeCli({ args, root = process.cwd(), write = console.log, smoke }) {
  const argumentsResult = validateSmokeCliArguments(args);
  if (argumentsResult.error) {
    write(argumentsResult.error);
    return 18;
  }
  try {
    const result = await runSmokeCommand({ root, target: argumentsResult.target, write, smoke });
    write(result);
    return result.startsWith("Smoke passed:") ? 0 : 17;
  } catch (error) {
    write(`Tarball consumer smoke failed: ${error.message}`);
    return 17;
  }
}
