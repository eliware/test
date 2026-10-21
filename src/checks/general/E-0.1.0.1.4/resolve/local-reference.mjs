import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";

export function resolveLocalMarkdownReference(root, file, reference) {
  const [pathname, fragment] = splitReference(reference);
  const target = pathname ? resolve(dirname(join(root, file)), pathname) : resolve(root, file);
  return { target, fragment, escapesRoot: isPathOutsideRoot(root, target) };
}

export function isPathOutsideRoot(root, target) {
  const relativeTarget = relative(root, target).split(sep).join("/");
  return escapesRepositoryRoot(relativeTarget);
}

export function escapesRepositoryRoot(path) {
  const normalized = path.replaceAll("\\", "/");
  return (
    normalized === ".." ||
    normalized.startsWith("../") ||
    /^[A-Za-z]:\//u.test(normalized) ||
    isAbsolute(path)
  );
}

function splitReference(value) {
  const [path, ...fragment] = value.split("#");
  return [path.split("?")[0], fragment.join("#")];
}
