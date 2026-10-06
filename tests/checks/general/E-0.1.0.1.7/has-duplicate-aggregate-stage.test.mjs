import { expect, test } from "@jest/globals";
import { hasDuplicateAggregateStage } from "../../../../src/checks/general/E-0.1.0.1.7/has-duplicate-aggregate-stage.mjs";

test.each([
  "npm run lint",
  "pnpm test",
  "yarn run build",
  "bun audit",
  "npm exec -- node bin/eliware-test.mjs --format-check",
])("detects duplicate stage command %s", (command) =>
  expect(hasDuplicateAggregateStage(command)).toBe(true),
);

test("ignores unrelated and non-string values", () => {
  expect(hasDuplicateAggregateStage("echo hello")).toBe(false);
  expect(hasDuplicateAggregateStage(null)).toBe(false);
});
