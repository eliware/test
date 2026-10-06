import { npmCommand } from "./npm-command.mjs";
import { runChild } from "./general/E-0.1/E-0.1.20/run-child.mjs";
import { collectRedactionSecrets } from "./collect-redaction-secrets.mjs";
import { redactProcessOutput } from "./redact-process-output.mjs";

export async function runNpmOutdated(
  root,
  {
    env = process.env,
    execute = runChild,
    platform = process.platform,
    execPath = process.execPath,
  } = {},
) {
  const [command, prefix] = npmCommand(
    platform,
    env.npm_execpath ?? "",
    execPath,
    undefined,
    root,
    env.PATH ?? env.Path,
  );
  const output = await execute(command, [...prefix, "outdated", "--json"], {
    cwd: root,
    detached: platform !== "win32",
    env: { ...env, npm_config_loglevel: "error" },
    maxOutputLength: 100_000,
  });
  if (![0, 1].includes(output.code)) {
    const detail = redactProcessOutput(output.stderr, collectRedactionSecrets(env)).trim();
    throw new Error(detail || `npm outdated failed with code ${output.code}.`);
  }
  let dependencies;
  try {
    dependencies = JSON.parse(output.stdout);
  } catch {
    const detail = redactProcessOutput(output.stderr, collectRedactionSecrets(env)).trim();
    throw new Error(
      detail
        ? `npm outdated returned invalid JSON: ${detail}`
        : "npm outdated returned invalid JSON.",
    );
  }
  const ignored = env.ELIWARE_TEST_SMOKE_CANDIDATE;
  const outdated = Object.keys(dependencies)
    .filter((name) => name !== ignored)
    .sort()
    .map((name) => `${name}@latest`);
  return { dependencies, outdated };
}
