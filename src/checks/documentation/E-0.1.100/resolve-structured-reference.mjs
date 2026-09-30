import { dirname, relative, resolve } from "node:path";

const uriPattern = /^[A-Za-z][A-Za-z\d+.-]*:/u;

export function resolveStructuredReference(root, file, reference) {
  const [path] = reference.split("#", 1);
  if (!path || uriPattern.test(path)) return null;
  const target = path.startsWith("/") ? resolve(root, path.slice(1)) : resolve(dirname(file), path);
  const fromRoot = relative(root, target);
  if (fromRoot.startsWith("..") || fromRoot.includes(":")) {
    throw new Error(`${reference} resolves outside the repository`);
  }
  return { target };
}
