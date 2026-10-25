import { expect, jest, test } from "@jest/globals";
import { createLazyChildProcessRedactors } from "../../../../../../../src/validation/shared/process/create/child/process-output-capture/redactors.mjs";

test("builds independent redactors on first use and reuses them", () => {
  const createTextStream = jest.fn((_secrets, _limit, options) => ({ options }));
  const makeSecretMatcher = jest.fn();
  const redactorsFactory = createLazyChildProcessRedactors(
    ["secret"],
    200,
    100,
    makeSecretMatcher,
    createTextStream,
  );

  expect(createTextStream).not.toHaveBeenCalled();
  expect(redactorsFactory.isInitialized()).toBe(false);
  const redactors = redactorsFactory.get();
  expect(redactorsFactory.get()).toBe(redactors);
  expect(redactorsFactory.isInitialized()).toBe(true);
  expect(createTextStream).toHaveBeenCalledTimes(2);
  expect(redactors.stdout).not.toBe(redactors.stderr);
  expect(createTextStream.mock.calls[0]).toMatchObject([
    ["secret"],
    200,
    { maxPendingLength: 100 },
  ]);
  expect(redactors.stdout.options.getSecretMatcher(["secret"], { maxScanWork: 1 })).toBeUndefined();
  expect(makeSecretMatcher).toHaveBeenCalledWith(["secret"], { maxScanWork: 1 });
});

test("uses the default redactor factory and matcher when omitted", () => {
  const redactors = createLazyChildProcessRedactors(["secret"], 100, 10).get();
  const output = redactors.stdout.push("secret") + redactors.stdout.finish();

  expect(output).toBe("[REDACTED]");
});
