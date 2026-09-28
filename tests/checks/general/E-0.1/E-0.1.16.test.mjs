import { expect, test } from "@jest/globals";
import { run } from "../../../../src/checks/general/E-0.1/E-0.1.16.mjs";

test("requires a v8 release version", () => {
  expect(run({ packageJson: { version: "8.0.0" } }).status).toBe("pass");
  expect(run({ packageJson: { version: "8.0.1-beta.1+build.3" } }).status).toBe("pass");
  expect(run({ packageJson: { version: "8.not-semver" } }).status).toBe("fail");
  expect(run({ packageJson: { version: "8.1.0+other-baseline" } }).status).toBe("fail");
  expect(run({ packageJson: { version: "7.0.0" } }).status).toBe("fail");
});
