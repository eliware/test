import { expect, test } from "@jest/globals";
import { getTestToolReferenceChecker } from "../../../../../../src/checks/application/E-0.1.4.1.3/validate/test-tool-references/dispatch.mjs";

test.each([
  ["src/run.mjs", 'import("vitest");', false, true],
  ["package.json", '{"scripts":{"test":"vitest run"}}', false, true],
  ["specs/policy.yaml", "run: vitest run", false, true],
  ["scripts/check.sh", "vitest run", false, true],
  ["README.md", "```bash\nnpx jest\n```", false, true],
  ["tests/run.test.mjs", 'import { test } from "@jest/globals";', false, false],
  ["config.txt", "vitest run", false, false],
  ["scripts/run.sh", "jest --runInBand", true, false],
  ["scripts/run.sh", "jest --runInBand", false, true],
  ["src/run.mjs", 'import "istanbul-lib-instrument";', true, false],
])("routes %s content to its format policy", (path, content, harness, expected) => {
  const checker = getTestToolReferenceChecker(path);
  expect(checker ? checker(content, harness) : false).toBe(expected);
});
