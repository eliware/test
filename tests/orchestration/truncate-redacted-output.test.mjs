import { expect, test } from "@jest/globals";
import { truncateRedactedOutput } from "../../src/orchestration/truncate-redacted-output.mjs";

test("preserves complete redaction markers at the output boundary", () => {
  expect(truncateRedactedOutput("prefix [REDACTED] tail", 17)).toBe("prefix [REDACTED]");
});

test("omits a redaction marker that cannot fit completely", () => {
  expect(truncateRedactedOutput("prefix [REDACTED] secret", 10)).toBe("prefix ");
});

test("bounds ordinary output and handles zero or negative limits", () => {
  expect(truncateRedactedOutput("ordinary text", 4)).toBe("ordi");
  expect(truncateRedactedOutput("ordinary text", 0)).toBe("");
  expect(truncateRedactedOutput("ordinary text", -1)).toBe("");
});
