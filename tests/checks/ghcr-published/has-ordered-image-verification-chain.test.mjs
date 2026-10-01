import { beforeEach, expect, jest, test } from "@jest/globals";

const findAttestation = jest.fn();
const findAttestationVerification = jest.fn();
const findDigestHandoff = jest.fn();
const findDigestInspection = jest.fn();
const findVersionTagDigestVerification = jest.fn();
const findImagePushes = jest.fn();
const imageDetails = jest.fn();
const steps = jest.fn();

jest.unstable_mockModule("../../../src/checks/ghcr-published/find-ghcr-attestation.mjs", () => ({
  findAttestation,
  findAttestationVerification,
}));
jest.unstable_mockModule("../../../src/checks/ghcr-published/find-ghcr-digest-handoff.mjs", () => ({
  findDigestHandoff,
}));
jest.unstable_mockModule(
  "../../../src/checks/ghcr-published/find-ghcr-digest-verification.mjs",
  () => ({
    findDigestInspection,
    findVersionTagDigestVerification,
  }),
);
jest.unstable_mockModule("../../../src/checks/ghcr-published/find-ghcr-image-push.mjs", () => ({
  findImagePushes,
  imageDetails,
}));
jest.unstable_mockModule("../../../src/checks/ghcr-published/workflow-structure.mjs", () => ({
  steps,
}));

const { hasOrderedImageVerificationChain } =
  await import("../../../src/checks/ghcr-published/has-ordered-image-verification-chain.mjs");

const pushes = [{ id: "first" }, { id: "second" }];
const verification = (id) => [
  { id: `${id}-attestation` },
  { id: `${id}-tag` },
  { id: `${id}-inspection` },
  { id: `${id}-verification` },
  { id: `${id}-handoff` },
];
const firstVerification = verification("first");
const secondVerification = verification("second");
const jobSteps = [pushes[0], ...firstVerification, pushes[1], ...secondVerification];
const expectedStages = [
  findAttestation,
  findVersionTagDigestVerification,
  findDigestInspection,
  findAttestationVerification,
  findDigestHandoff,
];

beforeEach(() => {
  jest.resetAllMocks();
  steps.mockReturnValue(jobSteps);
  findImagePushes.mockReturnValue(pushes);
  imageDetails.mockImplementation((push) => ({ digestReference: `digest:${push.id}` }));
  expectedStages.forEach((stage, stageIndex) => {
    const suffixes = ["attestation", "tag", "inspection", "verification", "handoff"];
    stage.mockImplementation((segment) =>
      segment.steps.find((step) => step.id.endsWith(suffixes[stageIndex])),
    );
  });
});

test("composes each push's evidence in stage order and confines it to that push segment", () => {
  expect(hasOrderedImageVerificationChain({ steps: jobSteps })).toBe(true);

  for (const stage of expectedStages) {
    expect(stage).toHaveBeenCalledTimes(2);
  }
  expect(findAttestation.mock.calls[0][0].steps).toEqual(firstVerification);
  expect(findAttestation.mock.calls[1][0].steps).toEqual(secondVerification);
  expect(imageDetails).toHaveBeenCalledWith(pushes[0]);
  expect(imageDetails).toHaveBeenCalledWith(pushes[1]);
  expect(
    findAttestation.mock.calls.map(([segment, details]) => [segment.steps[0], details]),
  ).toEqual([
    [firstVerification[0], { digestReference: "digest:first" }],
    [secondVerification[0], { digestReference: "digest:second" }],
  ]);
});

test("rejects absent pushes, unusable digests, incomplete evidence, and out-of-order evidence", () => {
  findImagePushes.mockReturnValueOnce([]);
  expect(hasOrderedImageVerificationChain({ steps: [] })).toBe(false);
  expect(findAttestation).not.toHaveBeenCalled();

  imageDetails.mockReturnValueOnce({ digestReference: null });
  expect(hasOrderedImageVerificationChain({ steps: jobSteps })).toBe(false);

  findDigestHandoff.mockReturnValueOnce(undefined);
  expect(hasOrderedImageVerificationChain({ steps: jobSteps })).toBe(false);

  findVersionTagDigestVerification.mockReturnValueOnce(firstVerification[0]);
  expect(hasOrderedImageVerificationChain({ steps: jobSteps })).toBe(false);
});

test("rejects each missing evidence stage before checking its position", () => {
  for (const stage of expectedStages) {
    stage.mockReturnValueOnce(undefined);
    expect(hasOrderedImageVerificationChain({ steps: jobSteps })).toBe(false);
  }
});

test("requires the final verification handoff to be the last job step", () => {
  steps.mockReturnValueOnce([...jobSteps, { run: "echo publication complete" }]);

  expect(hasOrderedImageVerificationChain({ steps: jobSteps })).toBe(false);
});

test("uses a later ordered chain when an earlier matching stage is out of order", () => {
  const stepsWithEarlyLookalike = [
    pushes[0],
    firstVerification[1],
    ...firstVerification,
    pushes[1],
    ...secondVerification,
  ];
  steps.mockReturnValue(stepsWithEarlyLookalike);

  expect(hasOrderedImageVerificationChain({ steps: stepsWithEarlyLookalike })).toBe(true);
});
