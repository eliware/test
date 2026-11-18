import { expect, jest, test } from "@jest/globals";
import prepareNpmConsumerSmokeWorkspace from "../../../../../src/validation/stages/smoke/run/prepare-workspace.mjs";
test("prepares the consumer context before workspace state", async () => {
  const context = {
    targetRoot: "consumer",
    assertTargetIdentity: jest.fn(),
    binNames: ["tool"],
    childEnv: { PATH: "consumer" },
  };
  const workspace = { tempRoot: "temporary" };
  const prepareTargetContext = jest.fn(async () => context);
  const prepareWorkspace = jest.fn(async ({ stateOptions }) => {
    stateOptions.write();
    return workspace;
  });
  const input = {
    root: "source",
    target: "consumer-path",
    packageJson: { name: "@eliware/example" },
    env: { PATH: "source" },
    prepareTargetContext,
    prepareWorkspace,
    captureState: jest.fn(),
  };
  await expect(prepareNpmConsumerSmokeWorkspace(input)).resolves.toEqual({ context, workspace });
  expect(prepareTargetContext).toHaveBeenCalledWith(
    expect.objectContaining({ root: "source", target: "consumer-path", env: input.env }),
  );
  expect(prepareWorkspace).toHaveBeenCalledWith(
    expect.objectContaining({
      root: "source",
      stateOptions: expect.objectContaining({
        targetRoot: "consumer",
        binNames: ["tool"],
        assertTargetIdentity: context.assertTargetIdentity,
      }),
    }),
  );
});
test("returns a target-context error without preparing a workspace", async () => {
  const prepareWorkspace = jest.fn();
  const context = { error: "target unavailable" };
  await expect(
    prepareNpmConsumerSmokeWorkspace({
      root: "source",
      prepareTargetContext: async () => context,
      prepareWorkspace,
    }),
  ).resolves.toEqual({ context });
  expect(prepareWorkspace).not.toHaveBeenCalled();
});
