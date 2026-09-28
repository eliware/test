import { readRepositoryText } from "../../read-repository-text.mjs";
import { dirname, join, resolve } from "node:path";

export function referencesIn(text) {
  return [
    ...text.matchAll(
      /(?:^|[\s("'`]|\]\()((?:\.\/)?(?:runbooks\/)?[^#\s"'`()]+\.json)#id=([A-Za-z0-9._-]+)/g,
    ),
  ].map(([, path, id]) => ({ path, id }));
}

export async function validateReferences(root, filesByPath, indexedPaths, context) {
  const surfaces = [join(root, "README.md"), join(root, "runbooks", "README.md")];
  const failures = [];
  for (const surface of surfaces) {
    let content;
    try {
      content = await readRepositoryText(context, surface);
    } catch {
      continue;
    }
    for (const reference of referencesIn(content)) {
      const target = resolve(dirname(surface), reference.path);
      const record = filesByPath.get(target);
      if (!record || record.id !== reference.id) {
        failures.push(
          `Runbook reference does not resolve to the declared record: ${reference.path}#id=${reference.id}.`,
        );
        continue;
      }
      indexedPaths.add(target);
    }
  }
  return failures.length ? failures.join("\n") : null;
}
