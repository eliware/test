import checkNpmVersion from "../check-npm-version.mjs";
export default async function runNpmPrerequisite(write, checkVersion = checkNpmVersion) {
  const diagnostic = await checkVersion();
  if (!diagnostic) return true;
  write(diagnostic);
  return false;
}
