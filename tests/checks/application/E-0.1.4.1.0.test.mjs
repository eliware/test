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
  target.repositoryInventory.files = async () => ["examples/demo.mjs"];
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
      documentationFiles: async () => ["README.md", ...documents],
      files: async () => [],
      readText: async (path) => (path.includes("docs") ? index : ""),
    },
  };
}
