import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

export async function validateStructuredReferences(root, files) {
  for (const relativeFile of files) {
    const file = join(root, relativeFile);
    const document = JSON.parse(await readFile(file, "utf8"));
    const references = [];
    const visit = (value) => {
      if (!value || typeof value !== "object") return;
      if (!Array.isArray(value) && typeof value.path === "string") references.push(value.path);
      for (const child of Object.values(value)) visit(child);
    };
    visit(document);
    for (const reference of references.filter((value) => value.startsWith("./")))
      await readFile(resolve(dirname(file), reference));
  }
  return null;
}
