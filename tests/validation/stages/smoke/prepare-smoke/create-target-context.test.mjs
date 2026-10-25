import { expect, test } from "@jest/globals";
import { createSmokeTargetContext } from "../../../../../src/validation/stages/smoke/prepare-smoke/create-target-context.mjs";

test("assembles resolved target data and copies the child environment", () => {
  const assertTargetIdentity = () => {};
  const env = { PATH: "consumer-path" };
  const context = createSmokeTargetContext(
    "/consumer",
    assertTargetIdentity,
    { bin: { one: "bin/one.mjs", two: "bin/two.mjs" } },
    env,
  );

  expect(context).toEqual({
    targetRoot: "/consumer",
    assertTargetIdentity,
    binNames: ["one", "two"],
    childEnv: env,
  });
  expect(context.childEnv).not.toBe(env);
});

test("uses an empty bin list when the package has no bin entry", () => {
  expect(createSmokeTargetContext("/consumer", () => {}, {}, {}).binNames).toEqual([]);
});
