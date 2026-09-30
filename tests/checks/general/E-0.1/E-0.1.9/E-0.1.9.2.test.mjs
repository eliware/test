import { expect, test } from "@jest/globals";
import { run } from "../../../../../src/checks/general/E-0.1/E-0.1.9/E-0.1.9.2.mjs";

test("requires explicit convention documents", () => {
  expect(run({ packageJson: { eliware: { apply: ["general"] } } }).status).toBe("pass");
  expect(run({ packageJson: { eliware: { apply: [] } } }).status).toBe("fail");
});

test("requires general and every dependent profile explicitly", () => {
  expect(
    run({ packageJson: { eliware: { apply: ["general", "application", "cli"] } } }).status,
  ).toBe("pass");
  expect(run({ packageJson: { eliware: { apply: ["cli"] } } }).status).toBe("fail");
});

test("rejects an unknown profile", () => {
  expect(run({ packageJson: { eliware: { apply: ["unknown"] } } }).status).toBe("fail");
});
