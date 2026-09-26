import { access } from "node:fs/promises";
import { join } from "node:path";

export async function inspectReadmeDocumentationIndexes(root) {
  let examplesRequired = false;
  try {
    await access(join(root, "examples"));
    examplesRequired = true;
  } catch {}
  for (const path of ["docs/README.md", "specs/README.md"]) {
    try {
      await access(join(root, path));
    } catch {
      return { examplesRequired, error: `README.md links to required documentation index ${path}, but it does not exist.` };
    }
  }
  if (examplesRequired) {
    try {
      await access(join(root, "examples", "README.md"));
    } catch {
      return { examplesRequired, error: "README.md links to examples/README.md, but it does not exist." };
    }
  }
  return { examplesRequired, error: null };
}
