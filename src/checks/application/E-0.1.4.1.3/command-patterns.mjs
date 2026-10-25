import { isDirectTestCommand } from "./command-patterns/recognize/direct.mjs";
import { isRuntimeTestCommand } from "./command-patterns/recognize/runtime.mjs";
import { findShellCommand, isWrappedTestCommand } from "./command-patterns/recognize/wrappers.mjs";

const runners = [
  "jest",
  "vitest",
  "mocha",
  "ava",
  "tap",
  "tape",
  "uvu",
  "c8",
  "nyc",
  "istanbul",
  "playwright",
  "cypress",
  "karma",
  "jasmine",
  "qunit",
  "wdio",
  "nightwatch",
  "testcafe",
  "protractor",
];

export function isTestToolCommand(value, harness = false) {
  const names = harness ? runners.slice(1) : runners;
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
