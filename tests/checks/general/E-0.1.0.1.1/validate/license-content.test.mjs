import { expect, test } from "@jest/globals";
import { validateLicenseContent } from "../../../../../src/checks/general/E-0.1.0.1.1/validate/license-content.mjs";

test("accepts approved license text with different whitespace", async () => {
  await expect(
    validateLicenseContent("repo", async () => "MIT\nLicense", "MIT License"),
  ).resolves.toEqual([]);
});

test("rejects different license text", async () => {
  await expect(validateLicenseContent("repo", async () => "Other", "MIT License")).resolves.toEqual(
    ["LICENSE must contain the complete approved MIT text."],
  );
});

test("reports when license text cannot be read", async () => {
  await expect(
    validateLicenseContent(
      "repo",
      async () => {
        throw new Error("read failed");
      },
      "MIT License",
    ),
  ).resolves.toEqual(["LICENSE could not be read."]);
});
