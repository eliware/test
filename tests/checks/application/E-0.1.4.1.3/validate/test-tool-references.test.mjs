import { expect, test } from "@jest/globals";
import { validateTestToolReferences } from "../../../../../src/checks/application/E-0.1.4.1.3/validate/test-tool-references.mjs";

test("detects runner references in source and package files", () => {
  expect(validateTestToolReferences("src/run.mjs", 'import("vitest");')).toBe(
    "src/run.mjs must not import or invoke a test runner or coverage tool.",
  );
  expect(validateTestToolReferences("package.json", '{"scripts":{"test":"vitest run"}}')).toBe(
    "package.json must not import or invoke a test runner or coverage tool.",
  );
});

test("allows the supported Jest API and harness instrumentation", () => {
  expect(
    validateTestToolReferences("tests/run.test.mjs", 'import { test } from "@jest/globals";'),
  ).toBeNull();
  expect(
    validateTestToolReferences("src/run.mjs", 'import "istanbul-lib-instrument";', true),
  ).toBeNull();
  expect(validateTestToolReferences("scripts/run.sh", "jest --runInBand", true)).toBeNull();
  expect(validateTestToolReferences("scripts/run.sh", "jest --runInBand", false)).toContain(
    "must not import or invoke a test runner",
  );
});

test("ignores comments and inert source configuration values", () => {
  expect(
    validateTestToolReferences(
      "src/run.mjs",
      '// vitest run\nconst settings = { runner: "mocha" };',
    ),
  ).toBeNull();
});

test("allows required Jest configuration in package.json", () => {
  expect(
    validateTestToolReferences(
      "package.json",
      '{"jest":{"testEnvironment":"node"},"scripts":{"test":"eliware-test"}}',
    ),
  ).toBeNull();
});

test("ignores malformed manifest text for the separate package parser", () => {
  expect(validateTestToolReferences("package.json", '{"vitest":')).toBeNull();
});

test("checks package scripts and YAML commands but allows inert values", () => {
  expect(
    validateTestToolReferences(
      "package.json",
      '{"description":"vitest is not used","scripts":{"test":"vitest run"}}',
    ),
  ).toContain("package.json must not import or invoke a test runner or coverage tool.");
  expect(
    validateTestToolReferences(
      "package.json",
      '{"description":"vitest","runner":"vitest","scripts":{"test":"eliware-test"}}',
    ),
  ).toBeNull();
  expect(
    validateTestToolReferences("package.json", '{"scripts":{"test":"vitest run"}}', true),
  ).toContain("package.json must not import or invoke a test runner or coverage tool.");
  expect(validateTestToolReferences("specs/policy.yaml", 'runner: "vitest"')).toBeNull();
  expect(validateTestToolReferences("scripts/check.sh", "# vitest run\nvitest run")).toContain(
    "scripts/check.sh must not import or invoke a test runner or coverage tool.",
  );
  expect(validateTestToolReferences("package.json", '{"scripts":{"test":12}}')).toBeNull();
  expect(validateTestToolReferences("package.json", '{"name":"package"}')).toBeNull();
  expect(
    validateTestToolReferences("package.json", '{"scripts":{"test":"echo vitest"}}'),
  ).toBeNull();
  expect(validateTestToolReferences("README.md", "vitest run")).toBeNull();
  expect(validateTestToolReferences("README.md", "Run `npx jest` to inspect tests.")).toBeNull();
  expect(validateTestToolReferences("README.md", "```bash\nnpx jest\n```")).toContain(
    "README.md must not import or invoke a test runner or coverage tool.",
  );
  expect(validateTestToolReferences("README.md", "```javascript\nrun('npx jest')\n```")).toBeNull();
  expect(
    validateTestToolReferences("README.md", "```bash\neliware-test --focused\n```"),
  ).toBeNull();
  expect(validateTestToolReferences(".github/workflow.yaml", "run: vitest run")).toContain(
    ".github/workflow.yaml must not import or invoke a test runner or coverage tool.",
  );
  expect(validateTestToolReferences(".github/workflow.yaml", "run: echo vitest run")).toBeNull();
  expect(
    validateTestToolReferences(
      ".github/workflow.yaml",
      "steps:\n  - name: Test\n    run: |\n      npm ci\n\n      npx vitest run",
    ),
  ).toContain(".github/workflow.yaml must not import or invoke a test runner or coverage tool.");
  expect(
    validateTestToolReferences("package.json", '{"scripts":{"test":"eliware-test"}}'),
  ).toBeNull();
});
