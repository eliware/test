export default function findShellCommand(command) {
  const shell = command.match(
    /^(?:sh|bash|zsh|cmd(?:\.exe)?|powershell|pwsh)\s+(?:-c|\/c|-Command)\s+(.+)$/iu,
  );
  return shell ? shell[1].replace(/^("|')(.*)\1$/u, "$2") : null;
}
