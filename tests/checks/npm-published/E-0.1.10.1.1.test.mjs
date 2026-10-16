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

test.each([
  [{ ...packageJson, files: undefined }, "nonempty array"],
  [{ ...packageJson, files: ["../outside"] }, "unsafe path"],
  [{ ...packageJson, files: [null] }, "unsafe path"],
  [{ ...packageJson, files: [...files, "src/"] }, "duplicate"],
  [{ ...packageJson, files: files.filter((entry) => entry !== "specs/") }, "specs/"],
  [{ ...packageJson, files: [...files.slice(1), files[0]] }, "start with required"],
])("rejects invalid package files metadata", (invalidPackage, message) => {
  expect(run({ packageJson: invalidPackage })).toMatchObject({
    ruleId,
    status: "fail",
    message: expect.stringContaining(message),
  });
});
