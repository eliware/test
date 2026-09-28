import { npmCommand } from "../../npm-command.mjs";

export function createOutdatedDependenciesCommand(root, { env, platform, execPath }) {
  const [executable, prefix] = npmCommand(
    platform,
    env.npm_execpath ?? "",
    execPath,
    undefined,
    root,
  );
  return {
    executable,
    args: [...prefix, "outdated", "--json"],
    options: {
      cwd: root,
      detached: platform !== "win32",
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...env, npm_config_loglevel: "error" },
    },
  };
}
