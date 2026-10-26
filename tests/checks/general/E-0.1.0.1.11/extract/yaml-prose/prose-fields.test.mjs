import { expect, test } from "@jest/globals";
import { isYamlProseField } from "../../../../../../src/checks/general/E-0.1.0.1.11/extract/yaml-prose/prose-fields.mjs";

test("identifies configured YAML prose fields and excludes metadata", () => {
  expect(
    [
      "description",
      "title",
      "purpose",
      "owner",
      "boundaries",
      "prerequisites",
      "steps",
      "prompt",
      "message",
      "help",
      "summary",
      "note",
      "notes",
      "support",
      "result",
      "expected",
      "scope",
      "acceptance",
      "content",
    ].every(isYamlProseField),
  ).toBe(true);
  expect(isYamlProseField("version")).toBe(false);
});
