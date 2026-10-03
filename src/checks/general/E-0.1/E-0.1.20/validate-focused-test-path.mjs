import { realpath, stat } from "node:fs/promises";
import { isAbsolute, posix, relative, resolve, sep, win32 } from "node:path";
import { parseFocusedArguments } from "../../../../cli/parse-focused-arguments.mjs";
import { focusedPathFrom } from "./build-jest-arguments.mjs";

export async function validateFocusedTestPath(root, args = []) {
  const absolutePath = parseFocusedArguments(args).positional.find(
    (argument) =>
      /^[A-Za-z]:/u.test(argument) ||
      isAbsolute(argument) ||
      posix.isAbsolute(argument) ||
      win32.isAbsolute(argument),
  );
  if (absolutePath) {
    throw new Error(`Focused test path must be repository-relative: ${absolutePath}`);
  }
  const focusedPath = focusedPathFrom(args);
  if (!focusedPath) return null;
  const normalized = focusedPath.replaceAll("\\", "/").replace(/^\.\//, "");
  if (normalized.split("/").includes("..")) {
    throw new Error(
      `Focused test path must not contain parent-directory traversal: ${focusedPath}`,
    );
  }
  const rootPath = await realpath(root);
  let targetPath;
  try {
    targetPath = await realpath(resolve(rootPath, normalized));
  } catch {
    throw new Error(`Focused test path does not exist: ${focusedPath}`);
  }
  const relativePath = relative(rootPath, targetPath);
  if (relativePath === ".." || relativePath.startsWith(`..${sep}`) || isAbsolute(relativePath)) {
    throw new Error(`Focused test path must resolve inside the repository: ${focusedPath}`);
  }
  if (!(await stat(targetPath)).isFile()) {
    throw new Error(`Focused test path must be a regular file: ${focusedPath}`);
  }
  return relativePath.split(sep).join("/");
}
