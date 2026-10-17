import { join } from "node:path";
import { inspectJestTestModule } from "../has/executable-jest-test.mjs";

export async function validateExecutableTests(files, readText, root) {
  const errors = [];
  for (const path of files.filter(
    (file) => file.startsWith("tests/") && file.endsWith(".test.mjs"),
  )) {
    const content = await readText(join(root, path)).catch(() => "");
    if (!inspectJestTestModule(content).hasExecutableTest)
      errors.push(`${path} must declare an executable Jest test.`);
  }
  return errors;
}
