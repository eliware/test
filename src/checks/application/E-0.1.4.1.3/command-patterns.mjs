import { isDirectTestCommand } from "./command-patterns/recognize/direct.mjs";
import { isRuntimeTestCommand } from "./command-patterns/recognize/runtime.mjs";
import { findShellCommand, isWrappedTestCommand } from "./command-patterns/recognize/wrappers.mjs";
import { testToolRunners } from "./command-patterns/recognize/package-script.mjs";

export function isTestToolCommand(value, harness = false) {
  const names = harness ? testToolRunners.slice(1) : testToolRunners;
  return value.split(/&&|\|\||[;|]/u).some((part) => isCommand(part.trim(), names));
}

function isCommand(command, names) {
  const prefix = /^(?:(?:[A-Z_][A-Z\d_]*=\S+)\s+)*(?:command\s+|exec\s+)?/iu;
  const normalized = command.replace(prefix, "");
  const shellCommand = findShellCommand(normalized);
  if (shellCommand) return isCommand(shellCommand, names);
  return (
    isDirectTestCommand(normalized, names) ||
    isWrappedTestCommand(normalized, names) ||
    isRuntimeTestCommand(normalized)
  );
}
