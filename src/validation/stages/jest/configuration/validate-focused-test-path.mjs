import { realpath, stat } from "node:fs/promises";
import { isAbsolute, posix, relative, resolve, sep, win32 } from "node:path";
import { parseFocusedArguments } from "../../../../cli/parse/focused-arguments.mjs";
import { resolveFocusedTestPaths } from "../../../../cli/resolve/focused/test-paths.mjs";

export async function validateFocusedTestPath(root, args = []) {
  const absolutePath = parseFocusedArguments(args).positional.find(isAbsoluteTestPath);
  if (absolutePath)
    throw new Error(`Focused test path must be repository-relative: ${absolutePath}`);
  const focusedPaths = resolveFocusedTestPaths(args, false);
  if (focusedPaths.length === 0) return [];
  const rootPath = await realpath(root);
  const validatedPaths = [];
  for (const path of focusedPaths) validatedPaths.push(await validatePath(rootPath, path));
  return validatedPaths;
}

async function validatePath(rootPath, focusedPath) {
  const normalized = focusedPath.replaceAll("\\", "/").replace(/^\.\//, "");
  if (normalized.split("/").includes(".."))
    throw new Error(
      `Focused test path must not contain parent-directory traversal: ${focusedPath}`,
    );
  const targetPath = await resolveFocusedTarget(rootPath, normalized, focusedPath);
  const relativePath = relative(rootPath, targetPath);
  if (relativePath === ".." || relativePath.startsWith(`..${sep}`) || isAbsolute(relativePath))
    throw new Error(`Focused test path must resolve inside the repository: ${focusedPath}`);
  if (!(await stat(targetPath)).isFile())
    throw new Error(`Focused test path must be a regular file: ${focusedPath}`);
  return relativePath.split(sep).join("/");
}

function isAbsoluteTestPath(path) {
  return (
    /^[A-Za-z]:/u.test(path) || isAbsolute(path) || posix.isAbsolute(path) || win32.isAbsolute(path)
  );
}

async function resolveFocusedTarget(rootPath, normalized, focusedPath) {
  try {
    return await realpath(resolve(rootPath, normalized));
  } catch {
    throw new Error(`Focused test path does not exist: ${focusedPath}`);
  }
}
