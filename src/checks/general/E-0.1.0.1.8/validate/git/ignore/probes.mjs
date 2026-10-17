import { requiredIgnoreCases } from "../../ignore-patterns.mjs";

export async function validateGitIgnoreProbes(root, runGit) {
  let result;
  try {
    result = await runGit(
      "git",
      ["-C", root, "check-ignore", "--verbose", "--", ...requiredIgnoreCases.map(([path]) => path)],
      { windowsHide: true },
    );
  } catch (error) {
    if (error.code !== 1) return inspectionErrors();
    result = { code: 1, stdout: error.stdout ?? "" };
  }
  const code = result.code ?? 0;
  if (![0, 1].includes(code)) return inspectionErrors();
  const ignored = new Set(
    (Buffer.isBuffer(result.stdout) ? result.stdout.toString("utf8") : (result.stdout ?? ""))
      .split(/\r?\n/u)
      .map((line) => line.slice(line.lastIndexOf("\t") + 1))
      .filter(Boolean),
  );
  return requiredIgnoreCases.flatMap(([path, shouldIgnore]) => {
    if (ignored.has(path) === shouldIgnore) return [];
    return [shouldIgnore ? `${path} must be ignored.` : `${path} must not be ignored.`];
  });
}

function inspectionErrors() {
  return requiredIgnoreCases.map(
    ([path]) => `Git ignore rules could not be inspected for ${path}.`,
  );
}
