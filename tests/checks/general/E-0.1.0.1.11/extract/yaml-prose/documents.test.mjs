import { expect, test } from "@jest/globals";
import extractYamlDocumentsProse from "../../../../../../src/checks/general/E-0.1.0.1.11/extract/yaml-prose/documents.mjs";

test("extracts prose from each YAML document", () => {
  expect(
    extractYamlDocumentsProse(
      'description: "First document."\n---\ndescription: "Second document."',
    ),
  ).toMatchObject([
    { text: "First document.", kind: "prose" },
    { text: "Second document.", kind: "prose" },
  ]);
});
