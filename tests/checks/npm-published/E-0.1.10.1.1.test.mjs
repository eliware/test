import { expect, test } from "@jest/globals";
import { readFile } from "node:fs/promises";
import { ruleId, run } from "../../../src/checks/npm-published/E-0.1.10.1.1.mjs";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));

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
  [{ ...packageJson, files: [...packageJson.files, "src/"] }, "duplicate"],
  [{ ...packageJson, files: packageJson.files.filter((entry) => entry !== "specs/") }, "specs/"],
  [
    {
      ...packageJson,
      files: [packageJson.files[1], packageJson.files[0], ...packageJson.files.slice(2)],
    },
    "start with required",
  ],
])("rejects invalid package files metadata", (invalidPackage, message) => {
  expect(run({ packageJson: invalidPackage })).toMatchObject({
    ruleId,
    status: "fail",
    message: expect.stringContaining(message),
  });
});
