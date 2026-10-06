import { expect, test } from "@jest/globals";
import { readFile } from "node:fs/promises";
import { validateRequiredPackageFiles } from "../../../../src/checks/general/E-0.1.0.1.1/validate-required-package-files.mjs";

const successStat = async () => ({ isFile: () => true });
const successRead = async () => readFile(new URL("../../../../LICENSE", import.meta.url), "utf8");

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
  const license = await readFile(new URL("../../../../LICENSE", import.meta.url), "utf8");
  const errors = await validateRequiredPackageFiles("/repo", {
    getStat: successStat,
    read: async () => license.replace("free of charge", "only for Eliware"),
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
  expect(errors).toHaveLength(7);
  expect(errors[4]).toContain("LICENSE is required");
  expect(errors[6]).toContain("LICENSE could not be read");
});
