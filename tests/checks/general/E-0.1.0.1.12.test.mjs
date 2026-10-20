import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../src/checks/general/E-0.1.0.1.12.mjs";

function context(index = "- [Guide](guide.md)") {
  return {
    root: "/repo",
    repositoryInventory: {
      documentationFiles: async () => ["README.md", "guide.md"],
      readText: async (path) => {
        const normalized = path.replaceAll("\\", "/");
        return normalized.endsWith("docs/README.md") ? index : "[Documentation](docs/README.md)";
      },
    },
  };
}

test("checks docs indexes for all repositories", async () => {
  await expect(run(context())).resolves.toEqual({ ruleId, status: "pass", message: "" });
});

test("reports documentation index errors", async () => {
  await expect(run(context(""))).resolves.toMatchObject({
    ruleId,
    status: "fail",
    message: expect.stringContaining("docs/README.md must link guide.md"),
  });
});

test("uses its default context", async () => {
  await expect(run()).resolves.toMatchObject({ ruleId, status: "fail" });
});
