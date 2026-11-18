import { expect, test } from "@jest/globals";
import classifyJestProcessFailure from "../../../../../../src/validation/stages/jest/execution/classify/process-failure.mjs";

test("classifies timeouts and unsuccessful process exits", () => {
  expect(classifyJestProcessFailure("rule", { timedOut: true }).message).toContain(
    "Jest timed out",
  );
  expect(classifyJestProcessFailure("rule", { code: 0 })).toBeNull();
  expect(classifyJestProcessFailure("rule", { code: 1, stdout: "" }).status).toBe("fail");
});
