import { expect, jest, test } from "@jest/globals";

const readFile = jest.fn();
const stat = jest.fn();
jest.unstable_mockModule("node:fs/promises", () => ({ readFile, stat }));
const { validateRequiredPackageFiles } =
  await import("../../../../../src/checks/general/E-0.1.0.1.1/validate/required-package-files.mjs");

const approvedLicense = `MIT License

Copyright (c) 2026 Eliware

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;
const successStat = async () => ({ isFile: () => true });
const successRead = async () => approvedLicense;

test("uses mocked filesystem defaults", async () => {
  stat.mockResolvedValue({ isFile: () => true });
  readFile.mockResolvedValue(approvedLicense);
  await expect(validateRequiredPackageFiles("/repo")).resolves.toEqual([]);
});

test("accepts all required files and the approved license", async () => {
  await expect(
    validateRequiredPackageFiles("/repo", { getStat: successStat, read: successRead }),
  ).resolves.toEqual([]);
});

test("reports missing, non-file, and malformed license paths", async () => {
  const getStat = async (path) => {
    if (path.endsWith("README.md")) throw new Error("missing");
    return { isFile: () => !path.endsWith("LICENSE") };
  };
  const errors = await validateRequiredPackageFiles("/repo", {
    getStat,
    read: async () => "MIT License only",
  });
  expect(errors.join("\n")).toContain("README.md is required");
  expect(errors.join("\n")).toContain("LICENSE must be a file");
  expect(errors.join("\n")).toContain("LICENSE must contain the complete approved MIT text");
});

test("rejects altered license text that keeps the old marker fragments", async () => {
  const errors = await validateRequiredPackageFiles("/repo", {
    getStat: successStat,
    read: async () => approvedLicense.replace("free of charge", "only for Eliware"),
  });
  expect(errors).toContain("LICENSE must contain the complete approved MIT text.");
});

test("reports required files when the stat call fails", async () => {
  const errors = await validateRequiredPackageFiles("/repo", {
    getStat: async () => {
      throw new Error("denied");
    },
    read: async () => {
      throw new Error("denied");
    },
  });
  expect(errors).toHaveLength(9);
  expect(errors[4]).toContain("LICENSE is required");
  expect(errors[8]).toContain("LICENSE could not be read");
});
