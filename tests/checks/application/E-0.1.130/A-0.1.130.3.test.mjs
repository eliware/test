import { expect, test } from "@jest/globals";
import { run } from "../../../../src/checks/application/E-0.1.130/A-0.1.130.3.mjs";

test("maps application entrypoint validation and distribution status", () => {
  expect(
    run({
      root: process.cwd(),
      packageJson: { bin: { app: "bin/eliware-test.mjs" }, private: true },
    }),
  ).toEqual({
    ruleId: "A-0.1.130.3",
    status: "pass",
    message: "",
  });
  expect(
    run({ root: process.cwd(), packageJson: { bin: { app: "bin/eliware-test.mjs" } } }),
  ).toMatchObject({ status: "fail", message: expect.stringContaining("distribution status") });
});

test("fails when no existing file entrypoint or start command is declared", () => {
  expect(run({ packageJson: { private: true } })).toEqual({
    ruleId: "A-0.1.130.3",
    status: "fail",
    message:
      "Application package.json must declare an existing runtime file entrypoint or a nonempty start command.",
  });
});
