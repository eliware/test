import { expect, test } from "@jest/globals";
import { validateRegeneratedLockfile } from "../../../../../src/checks/general/E-1/E-1.20/validate-regenerated-lockfile.mjs";

test("classifies regenerated lockfile matches and failures", async () => {
  expect(await validateRegeneratedLockfile({}, {}, async () => true)).toBeNull();
  expect(await validateRegeneratedLockfile({}, {}, async () => false)).toMatch(/does not match/);
  expect(await validateRegeneratedLockfile({}, {}, async () => { throw new Error("npm failed"); })).toBe("npm failed");
});
