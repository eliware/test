import { expect, test } from "@jest/globals";
import { selectConventionChecks } from "../../src/orchestrators/select-convention-checks.mjs";

test("selects only checks from explicitly applied profiles", async () => {
  const checks = await selectConventionChecks({ apply: ["application"] });
  expect(checks.length).toBeGreaterThan(0);
  expect(
    checks.every(({ ruleId }) => ruleId.startsWith("E-1.130") || ruleId.startsWith("A-1.130")),
  ).toBe(true);
});

test("rejects unknown convention profiles", async () => {
  await expect(selectConventionChecks({ apply: ["unknown"] })).rejects.toThrow(
    "Unknown convention group: unknown",
  );
});
