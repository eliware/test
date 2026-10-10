import { expect, test } from "@jest/globals";
import { readFile } from "node:fs/promises";
import { validateNpmPackageFiles } from "../../../../src/checks/npm-published/E-0.1.10.1.1/validate-npm-package-files.mjs";
const packageJson = JSON.parse(await readFile("package.json", "utf8"));
test("accepts ordered package entries with required npm specs", () => {
  expect(validateNpmPackageFiles(packageJson)).toEqual([]);
});
test.each([
  [{ ...packageJson, files: undefined }, "nonempty array"],
  [{ ...packageJson, files: ["../outside"] }, "unsafe path"],
  [{ ...packageJson, files: ["/absolute"] }, "unsafe path"],
  [{ ...packageJson, files: ["C:/drive"] }, "unsafe path"],
  [{ ...packageJson, files: ["src\\bad"] }, "unsafe path"],
  [{ ...packageJson, files: ["."] }, "unsafe path"],
  [{ ...packageJson, files: ["src/../outside"] }, "unsafe path"],
  [{ ...packageJson, files: [...packageJson.files, "src/"] }, "duplicate"],
  [{ ...packageJson, files: packageJson.files.filter((entry) => entry !== "specs/") }, "specs/"],
  [
    {
      ...packageJson,
      files: [packageJson.files[1], packageJson.files[0], ...packageJson.files.slice(2)],
    },
    "required entries",
  ],
])("rejects invalid npm package paths", (invalidPackage, message) => {
  expect(validateNpmPackageFiles(invalidPackage)).toEqual([expect.stringContaining(message)]);
});
