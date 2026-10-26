import { expect, test } from "@jest/globals";
import { isAllowedHarnessTestTool } from "../../../../../../../../src/checks/application/E-0.1.4.1.3/validate/application/metadata/test-tools/harness-exceptions.mjs";
import { validateApplicationTestTools } from "../../../../../../../../src/checks/application/E-0.1.4.1.3/validate/application/metadata/test-tools.mjs";

test("allows only the harness test and coverage dependencies", () => {
  expect(isAllowedHarnessTestTool("@eliware/test", "@jest/globals")).toBe(true);
  expect(isAllowedHarnessTestTool("@eliware/test", "jest")).toBe(true);
  expect(isAllowedHarnessTestTool("@eliware/test", "istanbul-lib-instrument")).toBe(true);
  expect(isAllowedHarnessTestTool("consumer", "jest")).toBe(false);
  expect(isAllowedHarnessTestTool("@eliware/test", "vitest")).toBe(false);
});

test("accepts the harness test dependencies in application metadata", () => {
  expect(
    validateApplicationTestTools({
      name: "@eliware/test",
      dependencies: { "@jest/globals": "30", jest: "30", "istanbul-lib-instrument": "6" },
    }),
  ).toEqual([]);
});
