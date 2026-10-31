import { expect, jest, test } from "@jest/globals";
import { validateReadmeSpecificationsIndex } from "../../../../../../src/checks/shared/E-0.1.0.1.3/validate-readme/specifications/index.mjs";

const headings = ["", "Features", "Requirements", "Support", "Links", "License"];
const linkedReadme = "## Features\n\n[Specifications](specs/README.md)";

test("accepts a README link when the specifications index can be read", async () => {
  const readIndex = jest.fn(async () => "specification index");
  await expect(validateReadmeSpecificationsIndex(linkedReadme, headings, readIndex)).resolves.toBe(
    null,
  );
  expect(readIndex).toHaveBeenCalledTimes(1);
});

test("reports a missing specifications index", async () => {
  const readIndex = jest.fn(async () => {
    throw new Error("missing index");
  });
  await expect(validateReadmeSpecificationsIndex(linkedReadme, headings, readIndex)).resolves.toBe(
    "README.md specs index link must resolve to specs/README.md.",
  );
});

test("does not read the index when the README link has the wrong placement", async () => {
  const readIndex = jest.fn();
  await expect(
    validateReadmeSpecificationsIndex(
      "## Support\n\n[Specifications](specs/README.md)",
      headings,
      readIndex,
    ),
  ).resolves.toBe(
    "README.md must not link specs/README.md from its header, Table of Contents, or footer.",
  );
  expect(readIndex).not.toHaveBeenCalled();
});
