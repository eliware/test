import { expect, test } from "@jest/globals";
import { run, ruleId } from "../../../src/checks/general/E-0.1.0.1.4.mjs";
import { createLocalMarkdownReferenceValidator } from "../../../src/checks/general/E-0.1.0.1.4/create-local-markdown-reference-validator.mjs";

test("validates this repository's README and specifications", async () => {
  await expect(
    run({ root: process.cwd(), packageJson: { eliware: { id: "E-0" } } }),
  ).resolves.toEqual({ ruleId, status: "pass", message: "" });
});

test("reports failures from an empty repository", async () => {
  const result = await run({ root: "missing", packageJson: {} });
  expect(result.ruleId).toBe(ruleId);
  expect(result.status).toBe("fail");
  expect(result.message).toContain("Markdown files could not be listed");
  expect(result.message).toContain("specs/");
});

test("uses the current directory when context is undefined", async () => {
  await expect(run(undefined, undefined)).resolves.toMatchObject({
    ruleId,
    status: "fail",
    message: expect.stringContaining("package.json.eliware.id"),
  });
});

test("uses default filesystem operations for a local README reference", async () => {
  const validate = createLocalMarkdownReferenceValidator(process.cwd());
  await expect(validate("README.md", "README.md")).resolves.toBeNull();
});
