import { expect, test } from "@jest/globals";
import { run } from "../../../../src/checks/application/E-1.130/A-1.130.3.mjs";

test("requires an application entrypoint and distribution status", () => {
  expect(run({ packageJson: { bin: { app: "bin/app.mjs" }, private: true } })).toEqual({
    ruleId: "A-1.130.3",
    status: "pass",
    message: "",
  });
  expect(run({ packageJson: { private: true } })).toEqual(
    expect.objectContaining({ status: "fail" }),
  );
  expect(run({ packageJson: { main: "index.mjs" } })).toEqual(
    expect.objectContaining({ status: "fail" }),
  );
  expect(run({ packageJson: { scripts: { start: "node index.mjs" } } })).toEqual(
    expect.objectContaining({ status: "fail" }),
  );
  expect(run({ packageJson: { bin: {}, private: true } })).toEqual(
    expect.objectContaining({ status: "fail" }),
  );
});
