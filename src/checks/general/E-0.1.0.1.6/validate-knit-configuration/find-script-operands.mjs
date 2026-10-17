const scriptRunners = new Set([
  "node",
  "node.exe",
  "bun",
  "bun.exe",
  "deno",
  "deno.exe",
  "tsx",
  "ts-node",
  "python",
  "python3",
  "py",
  "bash",
  "sh",
  "pwsh",
  "powershell",
]);
const tokenPattern = /"([^"]*)"|'([^']*)'|`([^`]*)`|([^\s"'`;&|]+)/gu;

export function findScriptOperands(command) {
  const tokens = [...command.matchAll(tokenPattern)].map((match) =>
    match.slice(1).find((value) => value !== undefined),
  );
  const runner = tokens[0]?.toLowerCase();
  if (!scriptRunners.has(runner)) return [];
  const args = tokens.slice(1);
  const wrappedCommand = findWrappedCommand(runner, args);
  if (wrappedCommand !== null) return findScriptOperands(wrappedCommand);
  const operand = findOperand(runner, args);
  return operand ? [operand] : [];
}

function findWrappedCommand(runner, args) {
  if (["bash", "sh"].includes(runner) && args[0] === "-c") return args[1] ?? "";
  if (["pwsh", "powershell"].includes(runner) && ["-c", "-Command"].includes(args[0]))
    return args[1] ?? "";
  return null;
}

function findOperand(runner, args) {
  if (["node", "node.exe", "bun", "bun.exe"].includes(runner)) {
    if (["-e", "--eval", "-p", "--print", "test"].includes(args[0])) return null;
    if (runner.startsWith("bun") && args[0] === "run") return args[1];
    return args.find((argument) => !argument.startsWith("-"));
  }
  if (["deno", "deno.exe"].includes(runner))
    return args[0] === "run"
      ? args.find((argument, index) => index > 0 && !argument.startsWith("-"))
      : null;
  if (["bash", "sh", "pwsh", "powershell"].includes(runner)) {
    if (["-File", "-file"].includes(args[0])) return args[1];
  }
  if (["python", "python3", "py"].includes(runner) && ["-c", "-m", "-"].includes(args[0]))
    return null;
  return args.find((argument) => !argument.startsWith("-"));
}
