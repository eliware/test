import { expect, test } from "@jest/globals";
import { isJsonProseField } from "../../../../../../src/checks/general/E-0.1.0.1.11/extract/json-prose/prose-fields.mjs";

test("identifies the configured JSON prose fields", () => {
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
      "content",
    ].every(isJsonProseField),
  ).toBe(true);
  expect(isJsonProseField("version")).toBe(false);
});
