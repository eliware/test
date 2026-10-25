import { relative, resolve } from "node:path";
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
  const output = Buffer.isBuffer(result.stdout)
    ? result.stdout.toString("utf8")
    : (result.stdout ?? "");
  const ignored = new Set(output.split(/\r?\n/u).flatMap((line) => parseIgnoredPath(line, root)));
  return requiredIgnoreCases.flatMap(([path, shouldIgnore]) => {
    if (ignored.has(path) === shouldIgnore) return [];
    return [shouldIgnore ? `${path} must be ignored.` : `${path} must not be ignored.`];
  });
}

function parseIgnoredPath(line, root) {
  const separator = line.indexOf("\t");
  if (separator < 0) return [];
  const match = /^(.*):[1-9]\d*:([^\t]+)$/u.exec(line.slice(0, separator));
  if (!match) return [];
  const [, source] = match;
  const sourcePath = resolve(root, source);
  const requiredSource = resolve(root, ".gitignore");
  if (!samePath(sourcePath, requiredSource)) return [];
  const path = line.slice(separator + 1);
  const required = requiredIgnoreCases.find(([requiredPath]) => requiredPath === path);
  return required ? [path] : [];
}

function samePath(left, right) {
  return relative(left, right) === "";
}

function inspectionErrors() {
  return requiredIgnoreCases.map(
    ([path]) => `Git ignore rules could not be inspected for ${path}.`,
  );
}
