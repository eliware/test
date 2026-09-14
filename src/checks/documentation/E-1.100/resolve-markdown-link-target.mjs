import { dirname, join, relative, resolve } from "node:path";

export function resolveMarkdownLinkTarget(root, source, reference) {
  const clean = reference.replace(/[?#].*$/, "");
  if (reference.startsWith("#")) return join(root, source);
  if (!clean || /^(?:https?:|mailto:)/iu.test(clean)) return null;
  const target = resolve(dirname(join(root, source)), clean);
  const fromRoot = relative(root, target);
  return fromRoot.startsWith("..") || fromRoot.includes(":") ? null : target;
}
