export function isJestPolicyFile(path) {
  if (path === "package.json") return true;
  const codeFile = /\.(?:mjs|js|cjs|jsx|ts|tsx|cts|mts|mjsx|cjsx|sh|ps1|py)$/iu.test(path);
  const configurationFile = /(?:config|rc|opts)(?:\.[^.]+)?$/iu.test(path.split("/").at(-1));
  return (/^(?:src|tests|bin|scripts|examples)\//u.test(path) && codeFile) || configurationFile;
}
