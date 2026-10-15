import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../src/checks/application/E-0.1.4.1.0.mjs";

test("E-0.1.4.1.0 passes when docs indexes exist", async () => {
  await expect(run(context(["guide.md"], "- [Guide](guide.md)"))).resolves.toEqual({
    ruleId,
    status: "pass",
    message: "",
  });
});

test("E-0.1.4.1.0 reports missing documentation indexes", async () => {
  const target = context(["guide.md"], "");
  target.repositoryInventory.documentationFiles = async ({ directory, predicate }) => {
    const files = directory.endsWith("examples") ? ["demo.mjs"] : ["README.md", "guide.md"];
    return files.filter(predicate);
  };
  await expect(run(target)).resolves.toMatchObject({
    ruleId,
    status: "fail",
    message: expect.stringContaining("docs/README.md must link guide.md"),
  });
});

test("E-0.1.4.1.0 uses its default context", async () => {
  await expect(run(undefined)).resolves.toMatchObject({ ruleId, status: "fail" });
});

function context(documents, index) {
  return {
    root: "repo",
    repositoryInventory: {
      readText: async (path) => {
        if (path === "AGENTS.md")
          return `## Application
Run focused tests first during development.
Run one test file with \`npm test -- tests/path/to/example.test.mjs\`.
Run multiple test files with \`npm test -- tests/path/to/first.test.mjs tests/path/to/second.test.mjs\`.
Avoid repeated full-suite runs during development.
Run the full \`npm test\` suite for final validation before a commit, milestone, or release.`;
        if (path === "README.md") return "## Configuration\n## Operations";
        return path.includes("docs") ? index : "[Documentation](docs/README.md)";
      },
      documentationFiles: async ({ directory, predicate, includeGenerated }) => {
        expect(includeGenerated).toBe(true);
        const files = directory.endsWith("examples") ? [] : ["README.md", ...documents];
        return files.filter(predicate);
      },
      files: async () => [],
    },
  };
}
