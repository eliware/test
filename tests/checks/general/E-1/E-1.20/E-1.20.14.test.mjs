import { expect, test } from "@jest/globals";
import { run } from "../../../../../src/checks/general/E-1/E-1.20/E-1.20.14.mjs";

test("reports direct dependencies without a source or tooling reference", async () => {
  await expect(
    run({
      root: "C:\\repo",
      packageJson: { dependencies: { alpha: "1.0.0" } },
      referencedDependencies: [],
    }),
  ).resolves.toEqual(expect.objectContaining({ status: "fail" }));
});

test("accepts referenced direct dependencies", async () => {
  await expect(
    run({
      root: "C:\\repo",
      packageJson: { dependencies: { alpha: "1.0.0" } },
      referencedDependencies: ["alpha"],
    }),
  ).resolves.toEqual({ ruleId: "E-1.20.14", status: "pass", message: "" });
});

test("passes when no direct dependency categories are declared", async () => {
  await expect(run({ packageJson: {} })).resolves.toEqual({
    ruleId: "E-1.20.14",
    status: "pass",
    message: "",
  });
});

test("includes optional and peer dependencies in the usage check", async () => {
  await expect(
    run({
      packageJson: {
        devDependencies: { dev: "1.0.0" },
        optionalDependencies: { optional: "1.0.0" },
        peerDependencies: { peer: "1.0.0" },
      },
      referencedDependencies: ["dev", "optional", "peer"],
    }),
  ).resolves.toEqual({ ruleId: "E-1.20.14", status: "pass", message: "" });
});

test("fails when dependency usage is uncertain", async () => {
  await expect(
    run({
      packageJson: { dependencies: { alpha: "1.0.0" } },
      referencedDependencies: Object.assign([], { uncertain: true }),
    }),
  ).resolves.toEqual({
    ruleId: "E-1.20.14",
    status: "fail",
    message: "Dependency usage is dynamically constructed and cannot be proven unused or used.",
  });
});

test("reports dependency inspection failures", async () => {
  await expect(
    run({ root: "C:\\missing-repository", packageJson: { dependencies: { alpha: "1.0.0" } } }),
  ).resolves.toEqual(
    expect.objectContaining({
      ruleId: "E-1.20.14",
      status: "fail",
      message: expect.stringContaining("Dependency usage could not be inspected"),
    }),
  );
});
