import { join } from "node:path";
import { readApplicationTestFiles } from "./read-test-files.mjs";

export async function validateApplicationLineLimits(files, readText, root, testFiles) {
  const tests = testFiles ?? (await readApplicationTestFiles(files, readText, root));
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
    const lines = content ? content.split(/\r\n|\n|\r/u) : [];
    if (content.endsWith("\n") || content.endsWith("\r")) lines.pop();
    const maximum = 150;
    if (lines.length > maximum)
      errors.push(`${path} has ${lines.length} physical lines. The maximum is ${maximum}.`);
  }
  for (const { path, content, readError } of tests) {
    if (readError) {
      errors.push(`${path} could not be read for its line limit.`);
      continue;
    }
    const lines = content ? content.split(/\r\n|\n|\r/u) : [];
    if (content.endsWith("\n") || content.endsWith("\r")) lines.pop();
    if (lines.length > 300)
      errors.push(`${path} has ${lines.length} physical lines. The maximum is 300.`);
  }
  return errors;
}
