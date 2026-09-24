import { expect, test } from "@jest/globals";
import { selectConventionChecks } from "../../src/orchestrators/select-convention-checks.mjs";

test("selects checks only from the explicitly applied profile", async () => {
  const checks = await selectConventionChecks({ apply: ["application"] });
  expect(checks.length).toBeGreaterThan(0);
  expect(checks.some(({ ruleId }) => ruleId === "E-1")).toBe(false);
  expect(checks.some(({ ruleId }) => ruleId.startsWith("E-1.130"))).toBe(true);
});

test.each(["documentation", "workspace", "infrastructure"])(
  "keeps general lint and formatter checks selected for %s repositories",
  async (profile) => {
    const checks = await selectConventionChecks({ apply: ["general", profile] });
    const ruleIds = checks.map(({ ruleId }) => ruleId);

    expect(ruleIds).toContain("E-1.4");
    expect(ruleIds).toContain("E-1.20.17");
  },
);

test("rejects unknown convention profiles", async () => {
  await expect(selectConventionChecks({ apply: ["unknown"] })).rejects.toThrow(
    "Unknown convention group: unknown",
  );
});

test("filters supplied checks to the selected profile", async () => {
  const applicationCheck = { ruleId: "E-1.130", modulePath: "application/E-1.130.mjs" };
  const checks = await selectConventionChecks({ apply: ["application"] }, [
    applicationCheck,
    { ruleId: "E-1", modulePath: "general/E-1.mjs" },
    { ruleId: "E-1.1" },
  ]);
  expect(checks).toEqual([applicationCheck]);
});

test("private selection includes private rules and excludes npm publication rules", async () => {
  const checks = await selectConventionChecks({ apply: ["general", "application", "private"] });
  const ruleIds = checks.map(({ ruleId }) => ruleId);
  expect(ruleIds).toContain("E-1.150");
  expect(ruleIds.some((ruleId) => ruleId.startsWith("E-1.140"))).toBe(false);
});
