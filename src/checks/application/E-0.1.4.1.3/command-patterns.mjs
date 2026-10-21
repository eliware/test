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
  const runner = names.join("|");
  const prefix = /^(?:(?:[A-Z_][A-Z\d_]*=\S+)\s+)*(?:command\s+|exec\s+)?/iu;
  const normalized = command.replace(prefix, "");
  const direct = new RegExp(`^(?:${runner})(?:\\.cmd)?(?:\\s|$)`, "iu");
  const binary = new RegExp(
    `^(?:\\.\\/)?node_modules[\\\\/]\\.bin[\\\\/](?:${runner})(?:[\\\\/\\s]|$)`,
    "iu",
  );
  const nodeBinary = new RegExp(
    `^node(?:\\.exe)?\\s+(?:--[\\w-]+(?:=\\S+)?\\s+)*node_modules[\\\\/]\\.bin[\\\\/](?:${runner})(?:[\\\\/\\s]|$)`,
    "iu",
  );
  const wrapper = new RegExp(
    `^(?:npx|npm\\s+exec|pnpm\\s+(?:exec|dlx)|yarn\\s+(?:exec|dlx)|bunx)(?:\\s+[^;|&]+)?\\s+(?:--\\s+)?(?:${runner})(?:\\s|$)`,
    "iu",
  );
  const shell = normalized.match(
    /^(?:sh|bash|zsh|cmd(?:\.exe)?|powershell|pwsh)\s+(?:-c|\/c|-Command)\s+(.+)$/iu,
  );
  if (shell) return isCommand(shell[1].replace(/^("|')(.*)\1$/u, "$2"), names);
  return (
    direct.test(normalized) ||
    binary.test(normalized) ||
    nodeBinary.test(normalized) ||
    wrapper.test(normalized) ||
    /^node(?:\.exe)?\s+(?:--[\w-]+(?:=\S+)?\s+)*--test(?:\s|$)/iu.test(normalized) ||
    /^(?:bun|deno)\s+test(?:\s|$)/iu.test(normalized)
  );
}
