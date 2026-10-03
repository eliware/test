import { lstat, realpath } from "node:fs/promises";
import { isAbsolute, relative, sep } from "node:path";

export async function resolveSmokeTarget(root, target, inspect = lstat) {
  let sourceRoot;
  let targetRoot;
  try {
    [sourceRoot, targetRoot] = await Promise.all([realpath(root), realpath(target)]);
  } catch {
    return { error: "Smoke source and target must both resolve to existing directories." };
  }
  const pathFromSource = relative(sourceRoot, targetRoot);
  if (
    pathFromSource === "" ||
    (pathFromSource !== ".." &&
      !pathFromSource.startsWith(`..${sep}`) &&
      !isAbsolute(pathFromSource))
  )
    return { error: "Smoke target must resolve outside the source checkout." };

  let identity;
  try {
    identity = await inspect(targetRoot);
    if (!identity.isDirectory())
      return { error: "Smoke target must resolve to an existing directory." };
  } catch {
    return { error: "Smoke target must resolve to an existing directory." };
  }
  return {
    targetRoot,
    assertIdentity: async () => {
      let current;
      try {
        current = await inspect(targetRoot);
      } catch {
        throw new Error(
          "Smoke target directory changed during validation; refusing unsafe access.",
        );
      }
      if (
        !current.isDirectory() ||
        current.dev !== identity.dev ||
        current.ino !== identity.ino ||
        current.birthtimeMs !== identity.birthtimeMs
      )
        throw new Error(
          "Smoke target directory changed during validation; refusing unsafe access.",
        );
    },
  };
}
