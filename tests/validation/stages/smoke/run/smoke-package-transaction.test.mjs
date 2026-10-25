import { beforeEach, expect, jest, test } from "@jest/globals";

const installSmokeCandidate = jest.fn();
const packSmokeCandidate = jest.fn();
jest.unstable_mockModule(
  "../../../../../src/validation/stages/smoke/install-smoke-candidate.mjs",
  () => ({ installSmokeCandidate }),
);
jest.unstable_mockModule(
  "../../../../../src/validation/stages/smoke/pack-smoke-candidate.mjs",
  () => ({ packSmokeCandidate }),
);

const { runSmokePackageTransaction } =
  await import("../../../../../src/validation/stages/smoke/run/smoke-package-transaction.mjs");

const request = {
  root: "source",
  packageJson: { name: "@eliware/test" },
  run: jest.fn(),
  command: "npm",
  prefix: [],
  packDirectory: "pack",
  targetRoot: "consumer",
  assertTargetIdentity: jest.fn(),
  env: {},
};

beforeEach(() => {
  jest.resetAllMocks();
  packSmokeCandidate.mockResolvedValue({ tarball: "package.tgz", digest: "abc123" });
});

test("packs, rechecks the target, and installs the package in order", async () => {
  const calls = [];
  const packCandidate = jest.fn(async () => {
    calls.push("pack");
    return { tarball: "package.tgz", digest: "abc123" };
  });
  const assertTargetIdentity = jest.fn(async () => calls.push("identity"));
  const installCandidate = jest.fn(async () => calls.push("install"));

  await expect(
    runSmokePackageTransaction({
      ...request,
      assertTargetIdentity,
      packCandidate,
      installCandidate,
    }),
  ).resolves.toBe("abc123");

  expect(calls).toEqual(["pack", "identity", "install"]);
  expect(installCandidate).toHaveBeenCalledWith(
    expect.objectContaining({ tarball: "package.tgz", targetRoot: "consumer" }),
  );
});

test("uses the default pack and install helpers", async () => {
  const assertTargetIdentity = jest.fn();
  await expect(runSmokePackageTransaction({ ...request, assertTargetIdentity })).resolves.toBe(
    "abc123",
  );

  expect(packSmokeCandidate).toHaveBeenCalledWith(
    expect.objectContaining({ root: "source", packDirectory: "pack", env: {} }),
  );
  expect(installSmokeCandidate).toHaveBeenCalledWith(
    expect.objectContaining({ tarball: "package.tgz", targetRoot: "consumer" }),
  );
  expect(assertTargetIdentity).toHaveBeenCalledTimes(1);
});
