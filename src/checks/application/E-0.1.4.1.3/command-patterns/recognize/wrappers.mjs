export function findShellCommand(command) {
  const shell = command.match(
    /^(?:sh|bash|zsh|cmd(?:\.exe)?|powershell|pwsh)\s+(?:-c|\/c|-Command)\s+(.+)$/iu,
  );
  return shell ? shell[1].replace(/^("|')(.*)\1$/u, "$2") : null;
}

export function isWrappedTestCommand(command, names) {
  const runner = names.join("|");
  const wrapper = new RegExp(
    `^(?:npx|npm\\s+exec|pnpm\\s+(?:exec|dlx)|yarn\\s+(?:exec|dlx)|bunx)(?:\\s+[^;|&]+)?\\s+(?:--\\s+)?(?:${runner})(?:\\s|$)`,
    "iu",
  );
  return wrapper.test(command);
}
