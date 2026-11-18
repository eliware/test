import runSmokeCommand from "./cli/command.mjs";
import validateSmokeCliArguments from "./cli/arguments.mjs";
import writeSmokeCliResult from "./cli/result.mjs";
export default async function runSmokeCli({
  args,
  root = process.cwd(),
  write = console.log,
  smoke,
}) {
  const argumentsResult = validateSmokeCliArguments(args);
  if (argumentsResult.error) {
    write(argumentsResult.error);
    return 18;
  }
  try {
    const result = await runSmokeCommand({
      root,
      target: argumentsResult.target,
      write,
      smoke,
    });
    return writeSmokeCliResult(result, write);
  } catch (error) {
    return writeSmokeCliResult(error, write);
  }
}
