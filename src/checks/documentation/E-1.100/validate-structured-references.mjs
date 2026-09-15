import { readFile, stat } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";

const uriPattern = /^[A-Za-z][A-Za-z\d+.-]*:/u;

function resolveReference(root, file, reference) {
  const [path] = reference.split("#", 1);
  if (!path || uriPattern.test(path)) return null;
  const target = path.startsWith("/")
    ? resolve(root, path.slice(1))
    : resolve(dirname(file), path);
  const fromRoot = relative(root, target);
  if (fromRoot.startsWith("..") || fromRoot.includes(":")) throw new Error(`${reference} resolves outside the repository`);
  return target;
}

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
    for (const reference of references) {
      const target = resolveReference(root, file, reference);
      if (target) await stat(target);
    }
  }
  return null;
}
