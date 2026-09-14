import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

export function referencesIn(text) {
  return [
    ...text.matchAll(
      /(?:^|[\s("'`]|\]\()((?:\.\/)?(?:runbooks\/)?[^#\s"'`()]+\.json)#id=([A-Za-z0-9._-]+)/g,
    ),
  ].map(([, path, id]) => ({ path, id }));
}

export async function validateReferences(root, filesByPath, indexedPaths) {
  const surfaces = [join(root, "README.md"), join(root, "runbooks", "README.md")];
  for (const surface of surfaces) {
    let content;
    try {
      content = await readFile(surface, "utf8");
    } catch {
      continue;
    }
    for (const reference of referencesIn(content)) {
      const target = resolve(dirname(surface), reference.path);
      const record = filesByPath.get(target);
      if (!record || record.id !== reference.id)
        return `Runbook reference does not resolve to the declared record: ${reference.path}#id=${reference.id}.`;
      indexedPaths.add(target);
    }
  }
  return null;
}
