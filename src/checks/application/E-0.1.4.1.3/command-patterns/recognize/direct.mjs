export function isDirectTestCommand(command, names) {
  const runner = names.join("|");
  const direct = new RegExp(`^(?:${runner})(?:\\.cmd)?(?:\\s|$)`, "iu");
  const binary = new RegExp(
    `^(?:\\.\\/)?node_modules[\\\\/]\\.bin[\\\\/](?:${runner})(?:[\\\\/\\s]|$)`,
    "iu",
  );
  const nodeBinary = new RegExp(
    `^node(?:\\.exe)?\\s+(?:--[\\w-]+(?:=\\S+)?\\s+)*node_modules[\\\\/]\\.bin[\\\\/](?:${runner})(?:[\\\\/\\s]|$)`,
    "iu",
  );
  return direct.test(command) || binary.test(command) || nodeBinary.test(command);
}
