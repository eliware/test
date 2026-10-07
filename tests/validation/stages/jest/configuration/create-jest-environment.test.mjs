import { expect, test } from "@jest/globals";
import { createJestEnvironment } from "../../../../../src/validation/stages/jest/configuration/create-jest-environment.mjs";

test("copies the invoking environment and adds required Node options", () => {
  const invoking = { PATH: "tools", TOKEN: "preserved" };
  const environment = createJestEnvironment(invoking);

  expect(environment).toEqual({
    ...invoking,
    NODE_OPTIONS: "--experimental-vm-modules --no-warnings",
  });
  expect(invoking).toEqual({ PATH: "tools", TOKEN: "preserved" });
});

test("defaults to a defensive copy of the process environment", () => {
  const environment = createJestEnvironment();

  expect(environment).not.toBe(process.env);
  expect(environment.NODE_OPTIONS).toContain("--experimental-vm-modules");
  expect(environment.NODE_OPTIONS).toMatch(/(?:^|\s)(?:--trace-warnings|--no-warnings)(?:$|\s)/u);
});

test("preserves configured Node options and adds only missing requirements", () => {
  expect(
    createJestEnvironment({ NODE_OPTIONS: "--experimental-vm-modules --trace-warnings" })
      .NODE_OPTIONS,
  ).toBe("--experimental-vm-modules --trace-warnings");
  expect(createJestEnvironment({ NODE_OPTIONS: "--no-warnings" }).NODE_OPTIONS).toBe(
    "--no-warnings --experimental-vm-modules",
  );
});

test("rejects unsupported inherited Node options for Jest", () => {
  expect(() => createJestEnvironment({ NODE_OPTIONS: "--require=./setup.mjs" })).toThrow(
    "Unsupported inherited NODE_OPTIONS for the Jest validation process.",
  );
});
