import { join } from "node:path";

export async function validateApplicationLineLimits(files, readText, root) {
  const targets = files.filter(
    (path) => /^src\/.*\.mjs$/u.test(path) || /^tests\/.*\.test\.mjs$/u.test(path),
  );
  const errors = [];
  for (const path of targets) {
    let content;
    try {
      content = await readText(join(root, path));
    } catch {
      errors.push(`${path} could not be read for its line limit.`);
      continue;
    }
    const lines = content ? content.split(/\r\n|\n|\r/u) : [];
    if (content.endsWith("\n") || content.endsWith("\r")) lines.pop();
    const maximum = path.startsWith("src/") ? 100 : 200;
    if (lines.length > maximum)
      errors.push(`${path} has ${lines.length} physical lines; maximum is ${maximum}.`);
  }
  return errors;
}
