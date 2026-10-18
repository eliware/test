const userAgentName = /^user[_-]?agent$/iu;

export function isUserAgentValue(value, parent) {
  if (parent?.type === "VariableDeclarator" && userAgentName.test(parent.id?.name ?? ""))
    return true;
  return (
    parent?.type === "ObjectProperty" &&
    userAgentName.test(parent.key?.name ?? parent.key?.value ?? "")
  );
}
