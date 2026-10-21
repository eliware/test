import { inspectJestTestModule } from "../has/executable-jest-test.mjs";

export function validateExecutableTests(testFiles) {
  const errors = [];
  for (const { path, content } of testFiles) {
    if (!inspectJestTestModule(content).hasExecutableTest)
      errors.push(`${path} must declare an executable Jest test.`);
  }
  return errors;
}
