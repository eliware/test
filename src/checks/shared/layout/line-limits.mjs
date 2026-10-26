import { join } from "node:path";

export async function validateLayoutLineLimits(files, readText, root, tests) {
  const targets = files.filter((path) => /^src\/.*\.mjs$/u.test(path));
  const errors = [];
  for (const path of targets) {
    let content;
    try {
      content = await readText(join(root, path));
    } catch {
      errors.push(`${path} could not be read for its line limit.`);
      continue;
    }
    const lines = countPhysicalLines(content);
    if (lines > 150) errors.push(`${path} has ${lines} physical lines. The maximum is 150.`);
  }
  for (const { path, content, readError } of tests) {
    if (readError) {
      errors.push(`${path} could not be read for its line limit.`);
      continue;
    }
    const lines = countPhysicalLines(content);
    if (lines > 300) errors.push(`${path} has ${lines} physical lines. The maximum is 300.`);
  }
  return errors;
}

function countPhysicalLines(content) {
  if (!content) return 0;
  const lines = content.split(/\r\n|\n|\r/u);
  if (content.endsWith("\n") || content.endsWith("\r")) lines.pop();
  return lines.length;
}
