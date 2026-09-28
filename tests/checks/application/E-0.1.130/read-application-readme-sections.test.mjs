import { expect, test } from "@jest/globals";
import { readApplicationReadmeSections } from "../../../../src/checks/application/E-0.1.130/read-application-readme-sections.mjs";

test("reads top-level application README sections and their content", () => {
  expect(
    readApplicationReadmeSections("## Configuration\nRuntime settings\n## Operations\nStart."),
  ).toEqual({ configuration: "Runtime settings", operations: "Start." });
});
