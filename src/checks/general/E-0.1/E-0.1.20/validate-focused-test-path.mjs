import { access } from "node:fs/promises";
import { join } from "node:path";
import { focusedPathFrom } from "./build-jest-arguments.mjs";

export async function validateFocusedTestPath(root, args = []) {
  const focusedPath = focusedPathFrom(args);
  if (!focusedPath) return null;
  const normalized = focusedPath.replaceAll("\\", "/").replace(/^\.\//, "");
  try {
    await access(join(root, normalized));
  } catch {
    throw new Error(`Focused test path does not exist: ${focusedPath}`);
  }
  return focusedPath;
}
