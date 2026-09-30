import { access } from "node:fs/promises";
import { join } from "node:path";

export async function inspectReadmeDocumentationIndexes(root, packageJson = {}) {
  const profiles = new Set(packageJson?.eliware?.apply ?? []);
  const docsRequired = profiles.has("application") || profiles.has("library");
  let examplesRequired = false;
  try {
    await access(join(root, "examples"));
    examplesRequired = true;
  } catch {}
  const missing = [];
  const requiredIndexes = ["specs/README.md"];
  if (docsRequired) requiredIndexes.unshift("docs/README.md");
  for (const path of requiredIndexes) {
    try {
      await access(join(root, path));
    } catch {
      missing.push(path);
    }
  }
  if (examplesRequired) {
    try {
      await access(join(root, "examples", "README.md"));
    } catch {
      missing.push("examples/README.md");
    }
  }
  return {
    docsRequired,
    examplesRequired,
    error: missing.length
      ? missing
          .map(
            (path) =>
              `README.md links to required documentation index ${path}, but it does not exist.`,
          )
          .join("\n")
      : null,
  };
}
