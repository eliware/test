import { expect, jest, test } from "@jest/globals";
import { getOutdatedDependencies } from "../../../../src/checks/general/E-0.1/get-outdated-dependencies.mjs";

test("uses outdated dependency results already present in the context", async () => {
  const outdatedDependencies = { alpha: { current: "1", latest: "2" } };
  const readOutdated = jest.fn();

  await expect(
    getOutdatedDependencies({ outdatedDependencies }, readOutdated),
  ).resolves.toEqual(outdatedDependencies);
  expect(readOutdated).not.toHaveBeenCalled();
});

test("uses the default reader when a context result avoids a lookup", async () => {
  const outdatedDependencies = { alpha: { current: "1", latest: "2" } };

  await expect(getOutdatedDependencies({ outdatedDependencies })).resolves.toEqual(
    outdatedDependencies,
  );
});

test("shares one outdated dependency lookup promise through the context", async () => {
  const context = { root: "fixture" };
  const outdatedDependencies = { alpha: { current: "1", latest: "2" } };
  const readOutdated = jest.fn(async (root) => {
    expect(root).toBe("fixture");
    return outdatedDependencies;
  });

  const first = getOutdatedDependencies(context, readOutdated);
  const second = getOutdatedDependencies(context, readOutdated);

  expect(second).toBe(first);
  await expect(first).resolves.toEqual(outdatedDependencies);
  expect(readOutdated).toHaveBeenCalledTimes(1);
});

test("uses the current working directory when the context has no root", async () => {
  const readOutdated = jest.fn(async () => ({}));

  await expect(getOutdatedDependencies({}, readOutdated)).resolves.toEqual({});

  expect(readOutdated).toHaveBeenCalledWith(process.cwd());
});
