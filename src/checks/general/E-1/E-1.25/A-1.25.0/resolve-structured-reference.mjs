import { access, readFile, stat } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";

const uriPattern = /^[A-Za-z][A-Za-z\d+.-]*:/u;

function splitFragment(reference) {
  const [path, ...fragments] = reference.split("#");
  return { path, fragment: fragments.join("#") };
}

async function hasJsonAnchor(target, fragment) {
  if (!fragment) return true;
  if (!target.endsWith(".json")) return true;
  let document;
  try {
    document = JSON.parse(await readFile(target, "utf8"));
  } catch {
    return false;
  }
  const wanted = fragment.startsWith("id=") ? fragment.slice(3) : fragment;
  const visit = (value) => {
    if (!value || typeof value !== "object") return false;
    if (value.id === wanted || Object.hasOwn(value, wanted)) return true;
    return Object.values(value).some(visit);
  };
  return visit(document);
}

export async function validateStructuredReference({
  root,
  file,
  field,
  value,
  registered = false,
}) {
  if (!value || value.trim() !== value || uriPattern.test(value)) {
    return "must be a nonempty repository-relative path, not a URI or absolute path";
  }
  const { path, fragment } = splitFragment(value);
  if (!path || isAbsolute(path) || path.startsWith("\\") || /^[A-Za-z]:/u.test(path)) {
    return "must be a repository-relative path";
  }
  const base = field.endsWith(".source") || field.endsWith(".tests") ? root : dirname(file);
  const target = resolve(base, path);
  const fromRoot = relative(root, target);
  const external = fromRoot.startsWith("..") || /^[A-Za-z]:/u.test(fromRoot);
  try {
    await access(target);
  } catch {
    if (external && registered) return null;
    return "does not resolve to an available target";
  }
  if (!path.endsWith("/") && !path.includes(".")) {
    const targetStat = await stat(target);
    if (!targetStat.isDirectory()) return "must identify a file with an extension";
  }
  if (!(await hasJsonAnchor(target, fragment))) return "has an unresolved JSON anchor";
  return null;
}
