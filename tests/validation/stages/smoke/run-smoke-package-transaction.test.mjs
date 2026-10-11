import { expect, jest, test } from "@jest/globals";
import { runSmokePackageTransaction } from "../../../../src/validation/stages/smoke/run-smoke-package-transaction.mjs";

test("packs, rechecks the target, prepares it, and installs the package in order", async () => {
  const calls = [];
  const packCandidate = jest.fn(async () => {
    calls.push("pack");
    return { tarball: "package.tgz", digest: "abc123" };
  });
  const assertTargetIdentity = jest.fn(async () => calls.push("identity"));
  const prepareTarget = jest.fn(async () => calls.push("prepare"));
  const installCandidate = jest.fn(async () => calls.push("install"));

  await expect(
    runSmokePackageTransaction({
      root: "source",
      packageJson: { name: "@eliware/test" },
      run: jest.fn(),
      command: "npm",
      prefix: [],
      packDirectory: "pack",
      targetRoot: "consumer",
      assertTargetIdentity,
      env: {},
      packCandidate,
      prepareTarget,
      installCandidate,
    }),
  ).resolves.toBe("abc123");

  expect(calls).toEqual(["pack", "identity", "prepare", "identity", "install"]);
  expect(prepareTarget).toHaveBeenCalledWith({
    targetRoot: "consumer",
    packageName: "@eliware/test",
  });
  expect(installCandidate).toHaveBeenCalledWith(
    expect.objectContaining({ tarball: "package.tgz", targetRoot: "consumer" }),
  );
});
