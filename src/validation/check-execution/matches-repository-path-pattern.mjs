export function matchesRepositoryPathPattern(pattern, repositoryPath) {
  let source = "^";
  const path = repositoryPath.replaceAll("\\", "/");
  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern[index];
    if (character !== "*") {
      source += character.replace(/[|\\{}()[\]^$+?.]/gu, "\\$&");
      continue;
    }
    if (pattern[index + 1] === "*") {
      if (pattern[index + 2] === "/") {
        source += "(?:[^/]+/)*";
        index += 2;
      } else {
        source += ".*";
        index += 1;
      }
    } else {
      source += "[^/]*";
    }
  }
  return new RegExp(`${source}$`, "u").test(path);
}
