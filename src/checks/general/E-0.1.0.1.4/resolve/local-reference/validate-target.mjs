import { readFile, realpath, stat } from "node:fs/promises";
import isPathOutsideRoot from "./is-path-outside-root.mjs";
import hasMarkdownFragmentTarget from "../markdown-fragment-target.mjs";
export default async function validateMarkdownLocalTarget(
  realRoot,
  target,
  fragment,
  dependencies = {},
) {
  const resolveRealpath = dependencies.realpath ?? realpath;
  const inspect = dependencies.stat ?? stat;
  const read = dependencies.read ?? readFile;
  const realTarget = await resolveRealpath(target);
  if (isPathOutsideRoot(realRoot, realTarget)) return "outside";
  const info = await inspect(target);
  if (fragment && target.toLowerCase().endsWith(".md"))
    return (await hasMarkdownFragmentTarget(read, target, fragment)) ? null : "fragment";
  return info.isFile() || info.isDirectory() ? null : "missing";
}
