import { expect, test } from "@jest/globals";
import { validateRequiredPackageFiles } from "../../../../src/checks/general/E-0.1.0.1.1/validate-required-package-files.mjs";

const license =
  'MIT License\nCopyright (c) 2026 Eliware\nPermission is hereby granted\nTHE SOFTWARE IS PROVIDED "AS IS"\nWITHOUT WARRANTY OF ANY KIND\nIN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE';
const successStat = async () => ({ isFile: () => true });
const successRead = async () => license;

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
  expect(errors.join("\n")).toContain("LICENSE is missing approved MIT text");
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
  expect(errors).toHaveLength(7);
  expect(errors[4]).toContain("LICENSE is required");
  expect(errors[6]).toContain("LICENSE could not be read");
});
