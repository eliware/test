import { join } from "node:path";
import { inspectJestTestModule } from "./has-executable-jest-test.mjs";

export async function validateMirroredTests(files, readText, root) {
  const sources = files.filter((path) => /^src\/.*\.mjs$/u.test(path));
  const tests = files.filter((path) => path.startsWith("tests/"));
  const expected = new Set(sources.map((path) => `tests/${path.slice(4, -4)}.test.mjs`));
  const actual = new Set(tests);
  const errors = [];
  for (const path of expected)
    if (!actual.has(path)) errors.push(`${path} is required for its source.`);
  for (const path of tests) {
    if (!path.endsWith(".test.mjs")) {
      errors.push(
        `${path} is not a mirrored .test.mjs file; move support files to test-fixtures/.`,
      );
      continue;
    }
    const source = `src/${path.slice("tests/".length, -".test.mjs".length)}.mjs`;
    if (!sources.includes(source)) errors.push(`${path} has no matching source file.`);
    const content = await readText(join(root, path)).catch(() => "");
    const inspected = inspectJestTestModule(content, path, source);
    if (!inspected.hasExecutableTest) errors.push(`${path} must declare an executable Jest test.`);
    if (!inspected.importsSource) errors.push(`${path} must import its exact source module.`);
  }
  return errors;
}
