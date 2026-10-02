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

test("accepts a nonempty start command when file entrypoints are absent", () => {
  expect(
    run({ packageJson: { private: true, scripts: { start: "node server.mjs" } } }),
  ).toMatchObject({ status: "pass", message: "" });
  expect(
    run({
      packageJson: { main: "", bin: {}, private: true, scripts: { start: "node server.mjs" } },
    }),
  ).toMatchObject({
    status: "fail",
    message: expect.stringContaining("entrypoint or a nonempty start command"),
  });
  expect(run({ packageJson: { private: true, scripts: { start: " " } } })).toMatchObject({
    status: "fail",
    message: expect.stringContaining("entrypoint or a nonempty start command"),
  });
});
