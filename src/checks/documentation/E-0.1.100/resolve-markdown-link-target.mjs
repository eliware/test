import { dirname, join, relative, resolve, sep } from "node:path";

export function resolveMarkdownLinkTarget(root, source, reference) {
  if (!reference) return join(root, source);
  const target = resolve(dirname(join(root, source)), reference);
  const fromRoot = relative(root, target).split(sep).join("/");
  return fromRoot === ".." || fromRoot.startsWith("../") || /^[A-Za-z]:\//u.test(fromRoot)
    ? null
    : target;
}
