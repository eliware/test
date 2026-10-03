import { beforeEach, expect, jest, test } from "@jest/globals";

const findImagePushes = jest.fn();
const findImageVerificationChainEnd = jest.fn();
const imageDetails = jest.fn();
const steps = jest.fn();

jest.unstable_mockModule("../../../src/checks/ghcr-published/find-ghcr-image-push.mjs", () => ({
  findImagePushes,
  imageDetails,
}));
jest.unstable_mockModule(
  "../../../src/checks/ghcr-published/find-image-verification-chain-end.mjs",
  () => ({ findImageVerificationChainEnd }),
);
jest.unstable_mockModule("../../../src/checks/ghcr-published/workflow-structure.mjs", () => ({
  steps,
}));

const { hasOrderedImageVerificationChain } =
  await import("../../../src/checks/ghcr-published/has-ordered-image-verification-chain.mjs");

const pushes = [{ id: "first" }, { id: "second" }];
const evidence = (id) => Array.from({ length: 5 }, (_, index) => ({ id: `${id}-${index}` }));
const firstEvidence = evidence("first");
const secondEvidence = evidence("second");
const jobSteps = [pushes[0], ...firstEvidence, pushes[1], ...secondEvidence];

beforeEach(() => {
  jest.resetAllMocks();
  steps.mockImplementation((job) => job.steps ?? []);
  findImagePushes.mockReturnValue(pushes);
  imageDetails.mockImplementation((push) => ({ digestReference: `digest:${push.id}` }));
  findImageVerificationChainEnd.mockImplementation((job) =>
    job.steps.findIndex(({ id }) => id.endsWith("-4")),
  );
});

test("checks every push using only its following steps and requires the last chain to end the job", () => {
  expect(hasOrderedImageVerificationChain({ steps: jobSteps })).toBe(true);
  expect(findImageVerificationChainEnd.mock.calls).toEqual([
    [{ steps: firstEvidence }, { digestReference: "digest:first" }],
    [{ steps: secondEvidence }, { digestReference: "digest:second" }],
  ]);
  expect(imageDetails).toHaveBeenCalledWith(pushes[0]);
  expect(imageDetails).toHaveBeenCalledWith(pushes[1]);
});

test("rejects no pushes and any push without a complete evidence chain", () => {
  findImagePushes.mockReturnValueOnce([]);
  expect(hasOrderedImageVerificationChain({ steps: [] })).toBe(false);

  findImageVerificationChainEnd.mockReturnValueOnce(-1);
  expect(hasOrderedImageVerificationChain({ steps: jobSteps })).toBe(false);
});

test("requires the final push's evidence handoff to be the last job step", () => {
  const withTrailingStep = [...jobSteps, { run: "echo publication complete" }];
  steps.mockReturnValueOnce(withTrailingStep);
  expect(hasOrderedImageVerificationChain({ steps: withTrailingStep })).toBe(false);
});
