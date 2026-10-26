import { isDirectTestCommand } from "./command-patterns/recognize/direct.mjs";
import { isRuntimeTestCommand } from "./command-patterns/recognize/runtime.mjs";
import { findShellCommand, isWrappedTestCommand } from "./command-patterns/recognize/wrappers.mjs";
import { testToolRunners } from "./command-patterns/recognize/package-script.mjs";
import {
  normalizeCommandPrefix,
  splitTestCommandChain,
} from "./command-patterns/parse-command.mjs";

export function isTestToolCommand(value, harness = false) {
  const names = harness ? testToolRunners.slice(1) : testToolRunners;
  return splitTestCommandChain(value).some((part) => isCommand(part, names));
}

function isCommand(command, names) {
  const normalized = normalizeCommandPrefix(command);
  const shellCommand = findShellCommand(normalized);
  if (shellCommand) return isCommand(shellCommand, names);
  return (
    isDirectTestCommand(normalized, names) ||
    isWrappedTestCommand(normalized, names) ||
    isRuntimeTestCommand(normalized)
  );
}
