import { dirname, relative, resolve } from "node:path";

const uriPattern = /^[A-Za-z][A-Za-z\d+.-]*:/u;

export function resolveStructuredReference(root, file, reference, allowCrossRepository) {
  const [path] = reference.split("#", 1);
  if (!path || uriPattern.test(path)) return null;
  const target = path.startsWith("/") ? resolve(root, path.slice(1)) : resolve(dirname(file), path);
  const fromRoot = relative(root, target);
  const external = fromRoot.startsWith("..") || fromRoot.includes(":");
  if (external && !allowCrossRepository) {
    throw new Error(`${reference} resolves outside the repository`);
  }
  return { target, external };
}

export function isWithinRegisteredRepository(target, repositoryRoot) {
  const path = relative(repositoryRoot, target);
  return !/^(?:\.\.(?:[/\\]|$)|[A-Za-z]:)/u.test(path);
}
