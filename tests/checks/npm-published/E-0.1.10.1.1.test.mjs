import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../src/checks/npm-published/E-0.1.10.1.1.mjs";

const files = ["src/", "docs/", "README.md", "AGENTS.md", "LICENSE", "RELEASE_NOTES.md", "specs/"];
const packageJson = { files, eliware: { apply: ["general", "npm-published"] } };

test("E-0.1.10.1.1 validates npm files metadata", () => {
  expect(run({ packageJson })).toEqual({ ruleId, status: "pass", message: "" });
  expect(run()).toMatchObject({
    status: "fail",
    message: expect.stringContaining("nonempty array"),
  });
});

test("reports package files validator errors", () => {
  expect(run({ packageJson: { ...packageJson, files: ["../outside"] } })).toMatchObject({
    ruleId,
    status: "fail",
    message: expect.stringContaining("unsafe path"),
  });
});
