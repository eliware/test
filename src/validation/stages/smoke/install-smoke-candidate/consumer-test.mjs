import { smokeCommandFailure } from "./command-failure.mjs";

export async function runSmokeConsumerTest({
  targetRoot,
  packageJson,
  run,
  command,
  prefix,
  env,
  assertTargetIdentity = async () => {},
}) {
  await assertTargetIdentity();
  const result = await run(command, [...prefix, "test"], {
    cwd: targetRoot,
    env: { ...env, ELIWARE_TEST_SMOKE_CANDIDATE: packageJson.name },
  });
  if (result.code !== 0) throw new Error(smokeCommandFailure(result, "Consumer npm test failed"));
}
