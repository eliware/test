import { commandTokens } from "./knit-command-tokens.mjs";

const allowedCommands = new Set(["node", "npm", "npx", "git", "echo"]);

export function validateKnitCommandStructure(parsed) {
  if (parsed.leadingExecutable) {
    return ".knit/validate.mjs must not execute JavaScript before the required subprocess commands.";
  }
  if (parsed.unsupported?.length > 0) {
    return ".knit/validate.mjs contains an unsupported dynamic or state-mutating operation.";
  }
  if (parsed.calls.some((call) => !commandTokens(call))) {
    return ".knit/validate.mjs must use statically inspectable child-process commands.";
  }
  if (parsed.calls.some((call) => !allowedCommands.has(commandTokens(call)[0].replace(/^.*[\\/]/u, "").toLowerCase()))) {
    return ".knit/validate.mjs uses a command outside the read-only validation allowlist.";
  }
  return null;
}
