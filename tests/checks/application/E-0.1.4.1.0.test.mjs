import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../src/checks/application/E-0.1.4.1.0.mjs";

test("E-0.1.4.1.0 passes when application guidance is present", async () => {
  await expect(run(context())).resolves.toEqual({
    ruleId,
    status: "pass",
    message: "",
  });
});

test("E-0.1.4.1.0 reports missing example indexes", async () => {
  const target = context(["demo.mjs"]);
  await expect(run(target)).resolves.toMatchObject({
    ruleId,
    status: "fail",
    message: expect.stringContaining("examples/README.md is required"),
  });
});

test("E-0.1.4.1.0 uses its default context", async () => {
  await expect(run(undefined)).resolves.toMatchObject({ ruleId, status: "fail" });
});

function context(examples = []) {
  return {
    root: "repo",
    repositoryInventory: {
      readText: async (path) => {
        if (path.replaceAll("\\", "/").endsWith("examples/README.md")) throw new Error("missing");
        if (path === "AGENTS.md")
          return `## Application
Run focused tests first during development.
Run one test file with \`npm test -- tests/path/to/example.test.mjs\`.
Run multiple test files with \`npm test -- tests/path/to/first.test.mjs tests/path/to/second.test.mjs\`.
Prevent repeated full-suite runs during development.
Run the full \`npm test\` suite for final validation before a commit, milestone, or release.`;
        if (path === "README.md") return "## Configuration\n## Operations";
        return "";
      },
      documentationFiles: async ({ directory, predicate, includeGenerated = false }) => {
        expect(includeGenerated).toBe(false);
        const files = directory.endsWith("examples") ? examples : [];
        return files.filter(predicate);
      },
      files: async () => [],
    },
  };
}
