import { access } from "node:fs/promises";
import { join } from "node:path";

export async function inspectReadmeDocumentationIndexes(root) {
  let examplesRequired = false;
  try {
    await access(join(root, "examples"));
    examplesRequired = true;
  } catch {}
  const missing = [];
  for (const path of ["docs/README.md", "specs/README.md"]) {
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
