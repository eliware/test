import { expect, test } from "@jest/globals";
import { runConventionStage } from "../../src/orchestrators/run-convention-stage.mjs";
import { readConventionConfig } from "../../src/orchestrators/read-convention-config.mjs";

test("returns a passing convention stage", async () => {
  const result = await runConventionStage(async () => [
    { ruleId: "E-1.0", status: "pass", message: "" },
  ]);
  expect(result).toEqual({ code: 0, category: "conventions", diagnostics: [] });
});

test("returns convention failure diagnostics for failed checks", async () => {
  const result = await runConventionStage(async () => [
    { ruleId: "E-1.0", status: "fail", message: "missing file" },
  ]);
  expect(result).toEqual({
    code: 18,
    category: "conventions",
    diagnostics: ["E-1.0: missing file"],
  });
});

test("preserves stable failure codes for each validation stage", async () => {
  await expect(
    runConventionStage(async () => [{ ruleId: "E-1.20", status: "fail", message: "Jest failed" }]),
  ).resolves.toEqual({ code: 8, category: "conventions", diagnostics: ["E-1.20: Jest failed"] });
  await expect(
    runConventionStage(async () => [
      { ruleId: "E-1.20.10", status: "fail", message: "coverage gap" },
    ]),
  ).resolves.toEqual({
    code: 10,
    category: "conventions",
    diagnostics: ["E-1.20.10: coverage gap"],
  });
  await expect(
    runConventionStage(async () => [{ ruleId: "E-1.4", status: "fail", message: "Oxlint failed" }]),
  ).resolves.toEqual({ code: 12, category: "conventions", diagnostics: ["E-1.4: Oxlint failed"] });
  await expect(
    runConventionStage(async () => [{ ruleId: "E-1.4", status: "fail", message: "process could not be started" }]),
  ).resolves.toEqual({ code: 14, category: "conventions", diagnostics: ["E-1.4: process could not be started"] });
  await expect(
    runConventionStage(async () => [
      { ruleId: "E-1.140.1", status: "fail", message: "pack failed" },
    ]),
  ).resolves.toEqual({
    code: 17,
    category: "conventions",
    diagnostics: ["E-1.140.1: pack failed"],
  });
  await expect(
    runConventionStage(async () => [{ ruleId: "E-1.20", status: "fail", message: "Jest could not be started" }]),
  ).resolves.toEqual({ code: 14, category: "conventions", diagnostics: ["E-1.20: Jest could not be started"] });
  await expect(
    runConventionStage(async () => [{ ruleId: "E-1.20", status: "fail", message: "unsupported focused path" }]),
  ).resolves.toEqual({ code: 18, category: "conventions", diagnostics: ["E-1.20: unsupported focused path"] });
  await expect(
    runConventionStage(async () => [{ ruleId: "E-1.20.12", status: "fail", message: "publication metadata" }]),
  ).resolves.toEqual({ code: 17, category: "conventions", diagnostics: ["E-1.20.12: publication metadata"] });
});

test("uses the highest code when several checks fail", async () => {
  const result = await runConventionStage(async () => [
    { ruleId: "E-1.0", status: "fail", message: "first" },
    { ruleId: "E-1.20.10", status: "fail", message: "coverage" },
  ]);
  expect(result.code).toBe(18);
  expect(result.diagnostics).toEqual(["E-1.0: first", "E-1.20.10: coverage"]);
});

test("handles a failed check without a message", async () => {
  await expect(
    runConventionStage(async () => [{ ruleId: "E-1.0", status: "fail" }]),
  ).resolves.toEqual({ code: 18, category: "conventions", diagnostics: ["E-1.0: undefined"] });
});

test("classifies invalid focused paths as argument failures", async () => {
  await expect(
    runConventionStage(async () => [
      { ruleId: "E-1.20", status: "fail", message: "Jest could not be started: Focused test path does not exist: tests/missing.test.mjs" },
    ]),
  ).resolves.toEqual({
    code: 18,
    category: "conventions",
    diagnostics: ["E-1.20: Jest could not be started: Focused test path does not exist: tests/missing.test.mjs"],
  });
});

test("normalizes convention-runner errors as convention failures", async () => {
  const result = await runConventionStage(async () => {
    throw new Error("invalid config");
  });
  expect(result).toEqual({ code: 18, category: "conventions", diagnostics: ["invalid config"] });
});

test("reads valid convention configuration", () => {
  const apply = ["general"];
  expect(readConventionConfig({ eliware: { apply } })).toEqual({ apply });
});

test("rejects convention configuration without apply groups", () => {
  expect(() => readConventionConfig({})).toThrow(/must define eliware\.apply/);
});

test("rejects an empty apply list", () => {
  expect(() => readConventionConfig({ eliware: { apply: [] } })).toThrow(/apply/);
});
