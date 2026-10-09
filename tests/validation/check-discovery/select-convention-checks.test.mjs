import { expect, jest, test } from "@jest/globals";

const discoverChecks = jest.fn();
jest.unstable_mockModule("../../../src/validation/check-discovery/discover-checks.mjs", () => ({
  discoverChecks,
}));

const { selectConventionChecks } =
  await import("../../../src/validation/check-discovery/select-convention-checks.mjs");

test("selects checks only from explicitly applied profiles", async () => {
  const checks = [{ ruleId: "E-0.1" }, { ruleId: "E-0.1.130" }];
  discoverChecks.mockResolvedValueOnce(checks);

  await expect(selectConventionChecks({ apply: ["general", "application"] })).resolves.toBe(checks);
  expect(discoverChecks).toHaveBeenCalledWith(["general", "application"]);
});

test.each(["documentation", "workspace", "infrastructure"])(
  "keeps general lint and formatter checks selected for %s repositories",
  async (profile) => {
    const checks = await selectConventionChecks({ apply: ["general", profile, "private"] }, [
      { ruleId: "E-0.1.4", modulePath: "general/E-0.1.4.mjs" },
      { ruleId: "E-0.1.20.17", modulePath: "general/E-0.1.20.17.mjs" },
      { ruleId: `${profile}-rule`, modulePath: `${profile}/${profile}.mjs` },
      { ruleId: "unselected-rule", modulePath: "application/application.mjs" },
    ]);
    const ruleIds = checks.map(({ ruleId }) => ruleId);

    expect(ruleIds).toContain("E-0.1.4");
    expect(ruleIds).toContain("E-0.1.20.17");
    expect(ruleIds).toContain(`${profile}-rule`);
  },
);

test("rejects unknown convention profiles", async () => {
  await expect(selectConventionChecks({ apply: ["unknown"] })).rejects.toThrow(
    "Unknown convention group: unknown",
  );
});

test("filters supplied checks to the selected profile", async () => {
  const applicationCheck = { ruleId: "E-0.1.130", modulePath: "application/E-0.1.130.mjs" };
  const checks = await selectConventionChecks({ apply: ["general", "application"] }, [
    applicationCheck,
    { ruleId: "E-0.1", modulePath: "general/E-0.1.mjs" },
    { ruleId: "E-0.1.1", modulePath: "general/E-0.1.1.mjs" },
  ]);
  expect(checks).toEqual([
    applicationCheck,
    { ruleId: "E-0.1", modulePath: "general/E-0.1.mjs" },
    { ruleId: "E-0.1.1", modulePath: "general/E-0.1.1.mjs" },
  ]);
});

test("private selection includes private rules and excludes npm publication rules", async () => {
  const checks = await selectConventionChecks({ apply: ["general", "application", "private"] }, [
    { ruleId: "E-0.1.150", modulePath: "private/E-0.1.150.mjs" },
    { ruleId: "E-0.1.140", modulePath: "npm-published/E-0.1.140.mjs" },
  ]);
  const ruleIds = checks.map(({ ruleId }) => ruleId);
  expect(ruleIds).toContain("E-0.1.150");
  expect(ruleIds.some((ruleId) => ruleId.startsWith("E-0.1.140"))).toBe(false);
});
