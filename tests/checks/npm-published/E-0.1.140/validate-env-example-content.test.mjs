import { expect, test } from "@jest/globals";
import { validateEnvExampleContent } from "../../../../src/checks/npm-published/E-0.1.140/validate-env-example-content.mjs";

test("accepts active environment variables with placeholder values", () => {
  expect(
    validateEnvExampleContent("# Runtime settings\nAPI_KEY=<your-api-key>\nPORT=YOUR_PORT\n"),
  ).toBeNull();
});

test("rejects empty, real-looking, malformed, and empty templates", () => {
  expect(validateEnvExampleContent("# Example only\n")).toContain("placeholder assignments");
  expect(validateEnvExampleContent("API_KEY=sk-live-value")).toContain("API_KEY");
  expect(validateEnvExampleContent("broken-line")).toContain("broken-line");
  expect(validateEnvExampleContent("PORT=3000")).toContain("PORT");
});
