import { afterEach, expect, jest, test } from "@jest/globals";
import {
  packageJson,
  createSmokeTarget,
  removeRoots,
} from "../../../../test-fixtures/npm-consumers/smoke-test-support.mjs";
import { prepareSmokeTargetContext } from "../../../../src/validation/stages/smoke/prepare-smoke-target-context.mjs";

const roots = [];
afterEach(async () => {
  await removeRoots(roots);
  roots.length = 0;
});

test("returns the resolved consumer, identity guard, executable names, and copied environment", async () => {
  const fixture = await createSmokeTarget(roots);
  const env = { PATH: "consumer-path" };
  const context = await prepareSmokeTargetContext({
    root: fixture.source,
    target: fixture.target,
    packageJson,
    env,
  });

  expect(context).toMatchObject({
    targetRoot: fixture.target,
    binNames: ["eliware-test"],
    childEnv: env,
  });
  expect(context.childEnv).not.toBe(env);
  await expect(context.assertTargetIdentity()).resolves.toBeUndefined();
});

test("returns request errors before it inspects the target", async () => {
  const inspectTargetRoot = jest.fn();
  const result = await prepareSmokeTargetContext({
    root: process.cwd(),
    target: "",
    packageJson,
    inspectTargetRoot,
  });

  expect(result.error).toContain("Supply one existing consumer");
  expect(inspectTargetRoot).not.toHaveBeenCalled();
});

test("returns no executable names when the package has no bin entry", async () => {
  const fixture = await createSmokeTarget(roots);
  const context = await prepareSmokeTargetContext({
    root: fixture.source,
    target: fixture.target,
    packageJson: { ...packageJson, bin: undefined },
  });

  expect(context.binNames).toEqual([]);
});
