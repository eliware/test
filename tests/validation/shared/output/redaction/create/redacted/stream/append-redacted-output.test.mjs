import { expect, test } from "@jest/globals";
import { createOutputByteBudget } from "../../../../../../../../src/validation/shared/output/redaction/create/output-byte-budget.mjs";
import { appendRedactedOutput } from "../../../../../../../../src/validation/shared/output/redaction/create/redacted/stream/append-redacted-output.mjs";

test("keeps partial redaction markers outside the byte budget", () => {
  const budget = createOutputByteBudget(5);
  const matchEnds = Array.from({ length: 8 }, (_, index) => (index === 2 ? 8 : 0));

  expect(appendRedactedOutput("éxsecret", matchEnds, budget)).toBe("éx");
  expect(budget.capturedBytes).toBe(Buffer.byteLength("éx"));
});
