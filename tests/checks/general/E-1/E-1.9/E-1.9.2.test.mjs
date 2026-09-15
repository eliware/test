import { expect, test } from "@jest/globals";
import { run } from "../../../../../src/checks/general/E-1/E-1.9/E-1.9.2.mjs";

test("requires explicit convention documents", () => {
  expect(run({ packageJson: { eliware: { apply: ["general"] } } }).status).toBe("pass");
  expect(run({ packageJson: { eliware: { apply: [] } } }).status).toBe("fail");
});

test("accepts a profile whose inherited requirements are resolved by the harness", () => {
  expect(run({ packageJson: { eliware: { apply: ["cli"] } } }).status).toBe("pass");
});

test("rejects an unknown profile", () => {
  expect(run({ packageJson: { eliware: { apply: ["unknown"] } } }).status).toBe("fail");
});
