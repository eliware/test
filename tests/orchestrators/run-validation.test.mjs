import { rm, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { fixture } from "../../test-fixtures/run-validation.mjs";
import { runValidation } from "../../src/orchestrators/run-validation.mjs";
import { validateExemptionRecords } from "../../src/orchestrators/validate-exemption-records.mjs";

test("runs general checks and returns pass/fail results with exact rule IDs", async () => {
  const results = await runValidation(await fixture({ apply: ["general"] }));
  expect(results.map(({ ruleId, status }) => ({ ruleId, status }))).toEqual(
    expect.arrayContaining([
      { ruleId: "E-1.0", status: "pass" },
      { ruleId: "A-1.0.0", status: "pass" },
      { ruleId: "A-1.0.1", status: "pass" },
      { ruleId: "A-1.0.2", status: "pass" },
      { ruleId: "A-1.0.3", status: "pass" },
      { ruleId: "A-1.0.4", status: "pass" },
      { ruleId: "A-1.0.6", status: "pass" },
      { ruleId: "A-1.0.7", status: "pass" },
      { ruleId: "A-1.0.8", status: "pass" },
      { ruleId: "A-1.0.9", status: "pass" },
      { ruleId: "A-1.0.10", status: "pass" },
      { ruleId: "A-1.0.11", status: "pass" },
      { ruleId: "E-1.1", status: "pass" },
      { ruleId: "E-1.2", status: "pass" },
      { ruleId: "E-1.3", status: "pass" },
      { ruleId: "E-1.9", status: "pass" },
      { ruleId: "E-1.9.0", status: "pass" },
      { ruleId: "E-1.9.5", status: "pass" },
      { ruleId: "A-1.9.6", status: "pass" },
      { ruleId: "E-1.10", status: "pass" },
      { ruleId: "E-1.14", status: "pass" },
      { ruleId: "E-1.16", status: "pass" },
      { ruleId: "E-1.19", status: "pass" },
      { ruleId: "A-1.22.1", status: "pass" },
      { ruleId: "E-1.23", status: "pass" },
      { ruleId: "E-1.24", status: "pass" },
      { ruleId: "A-1.24.0", status: "pass" },
      { ruleId: "A-1.24.1", status: "pass" },
      { ruleId: "E-1.24.2", status: "pass" },
      { ruleId: "E-1.24.3", status: "pass" },
      { ruleId: "E-1.24.4", status: "pass" },
      { ruleId: "A-1.25.0", status: "pass" },
      { ruleId: "E-1.26", status: "pass" },
      { ruleId: "A-1.26.0", status: "pass" },
    ]),
  );
  expect(results.every(({ status }) => ["pass", "fail"].includes(status))).toBe(true);
});

test("rejects impossible exemption approval dates", async () => {
  const root = await fixture({
    apply: ["general"],
    exempt: [
      {
        ruleId: "E-1.0",
        reason: "fixture",
        approver: "Eli",
        approvalTimestamp: "2026-09-11T00:00:00Z",
        expiry: "2026-02-31",
      },
    ],
  });
  await expect(runValidation(root)).rejects.toThrow(/Every exemption/);
});

test("rejects exemption dates that do not use the required format", () => {
  expect(() =>
    validateExemptionRecords([
      {
        ruleId: "E-1.0",
        reason: "fixture",
        approver: "Eli",
        expiry: "2026-9-11",
        review: "fixture",
      },
    ]),
  ).toThrow(/Every exemption/);
});

test("retains selected checks when the fixture is incomplete", async () => {
  const root = await fixture({ apply: ["general"] });
  await rm(join(root, "README.md"));
  expect((await runValidation(root)).find(({ ruleId }) => ruleId === "E-1.1.0").status).toBe(
    "fail",
  );
});

test("runs explicitly applied profile groups", async () => {
  const results = await runValidation(await fixture({ apply: ["general", "application", "cli"] }));
  expect(results.map(({ ruleId }) => ruleId)).toContain("E-1.60");
});

test("fails when the specification index is missing", async () => {
  const root = await fixture({ apply: ["general"] });
  await rm(join(root, "specs", "README.md"));
  expect((await runValidation(root)).find(({ ruleId }) => ruleId === "E-1.2").status).toBe("fail");
});

test("fails when required package identity metadata is missing", async () => {
  const root = await fixture({ apply: ["general"] });
  const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
  delete packageJson.name;
  await writeFile(join(root, "package.json"), JSON.stringify(packageJson));
  expect((await runValidation(root)).find(({ ruleId }) => ruleId === "E-1.19").status).toBe("fail");
});

test("retains the release check when release notes are missing", async () => {
  const root = await fixture({ apply: ["general"] });
  await rm(join(root, "RELEASE_NOTES.md"));
  expect((await runValidation(root)).find(({ ruleId }) => ruleId === "E-1.26").status).toBe("pass");
});
