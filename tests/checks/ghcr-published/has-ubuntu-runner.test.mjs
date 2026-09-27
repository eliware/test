import { expect, test } from "@jest/globals";
import { hasUbuntuRunner } from "../../../src/checks/ghcr-published/has-ubuntu-runner.mjs";

test("recognizes supported Ubuntu runner labels after workflow normalization", () => {
  expect(hasUbuntuRunner({}, { runsOn: "ubuntu-latest" })).toBe(true);
  expect(hasUbuntuRunner({}, { "runs-on": "ubuntu-24.04" })).toBe(true);
  expect(hasUbuntuRunner({}, { "runs-on": "windows-latest" })).toBe(false);
  expect(hasUbuntuRunner({}, { "runs-on": "my-ubuntu-latest-runner" })).toBe(false);
  expect(hasUbuntuRunner({}, { "runs-on": "${{ matrix.runner }} ubuntu-latest" })).toBe(false);
  expect(hasUbuntuRunner({}, { "runs-on": ["self-hosted", "ubuntu-22.04"] })).toBe(true);
  expect(hasUbuntuRunner({}, { "runs-on": ["self-hosted", "my-ubuntu-latest-runner"] })).toBe(
    false,
  );
  expect(hasUbuntuRunner({}, null)).toBe(false);
});
