import { beforeEach, expect, jest, test } from "@jest/globals";

const findAttestation = jest.fn();
const findAttestationVerification = jest.fn();
const findDigestHandoff = jest.fn();
const findDigestInspection = jest.fn();
const findVersionTagDigestVerification = jest.fn();
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
  () => ({ findDigestInspection, findVersionTagDigestVerification }),
);
jest.unstable_mockModule("../../../src/checks/ghcr-published/workflow-structure.mjs", () => ({
  steps,
}));

const { findImageVerificationChainEnd } =
  await import("../../../src/checks/ghcr-published/find-image-verification-chain-end.mjs");

const evidence = [
  { id: "attestation" },
  { id: "tag" },
  { id: "inspection" },
  { id: "verification" },
  { id: "handoff" },
];
const finders = [
  findAttestation,
  findVersionTagDigestVerification,
  findDigestInspection,
  findAttestationVerification,
  findDigestHandoff,
];
const details = { digestReference: "digest:sha256" };

beforeEach(() => {
  jest.resetAllMocks();
  steps.mockImplementation((job) => job.steps ?? []);
  finders.forEach((finder, index) => {
    const suffix = ["attestation", "tag", "inspection", "verification", "handoff"][index];
    finder.mockImplementation((job) => job.steps.find((step) => step.id.endsWith(suffix)));
  });
});

test("finds the last evidence step while advancing through the required stage order", () => {
  const job = { steps: [{ id: "setup" }, ...evidence, { id: "next-push" }] };
  expect(findImageVerificationChainEnd(job, details)).toBe(5);
  for (const finder of finders) expect(finder).toHaveBeenCalledTimes(1);
  expect(findAttestation.mock.calls[0][0].steps).toEqual(job.steps);
  expect(findVersionTagDigestVerification.mock.calls[0][0].steps).toEqual(job.steps.slice(2));
  expect(findDigestHandoff.mock.calls[0][0].steps).toEqual(job.steps.slice(5));
});

test("rejects missing digest references and missing evidence stages", () => {
  expect(findImageVerificationChainEnd({ steps: evidence }, {})).toBe(-1);
  for (const finder of finders) {
    finder.mockReturnValueOnce(undefined);
    expect(findImageVerificationChainEnd({ steps: evidence }, details)).toBe(-1);
  }
});

test("rejects out-of-order evidence and accepts a later complete chain after a lookalike", () => {
  findVersionTagDigestVerification.mockReturnValueOnce(evidence[0]);
  expect(findImageVerificationChainEnd({ steps: evidence }, details)).toBe(-1);

  const stepsWithLookalike = [evidence[1], ...evidence];
  expect(findImageVerificationChainEnd({ steps: stepsWithLookalike }, details)).toBe(5);
});
