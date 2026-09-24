import { expect, test } from "@jest/globals";
import { parseEnvironmentLine } from "../../../../../src/checks/general/E-1/E-1.20/parse-env-line.mjs";

test("parses required and optional assignments, trimming quoted values", () => {
  expect(parseEnvironmentLine("TOKEN=value")).toEqual({ type: "assignment", name: "TOKEN", value: "value", optional: false });
  expect(parseEnvironmentLine("# API_KEY = 'quoted value' ")).toEqual({ type: "assignment", name: "API_KEY", value: "quoted value", optional: true });
  expect(parseEnvironmentLine("VALUE=  spaced  ")).toEqual({ type: "assignment", name: "VALUE", value: "spaced", optional: false });
});

test("classifies comments, invalid content, and blank lines", () => {
  expect(parseEnvironmentLine(" # optional declaration")).toEqual({ type: "comment", value: "optional declaration" });
  expect(parseEnvironmentLine("not an assignment")).toEqual({ type: "content" });
  expect(parseEnvironmentLine("  ")).toEqual({ type: "blank" });
});
