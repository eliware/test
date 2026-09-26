import { expect, test } from "@jest/globals";
import { validateWorkflowPostTestCommands } from "../../../../../src/checks/general/E-0.1/E-0.1.24/validate-workflow-post-test-commands.mjs";

test("allows reporting commands after npm test", () => {
  for (const command of ["echo done", "printf done"]) {
    expect(validateWorkflowPostTestCommands("ci.yml", [{ command }], -1)).toBeNull();
  }
});

test("rejects other commands after npm test", () => {
  expect(validateWorkflowPostTestCommands("ci.yml", [{ command: "rm -rf ." }], -1)).toContain(
    "reporting commands after npm test",
  );
});
