import { expect, test } from "@jest/globals";
import { run } from "../../../../../src/checks/general/E-1/E-1.9/A-1.9.1.mjs";

test("requires a valid package baseline and selected documents", () => {
  expect(run({ packageJson: { version: "8.0.0", eliware: { apply: ["general"] } } }).status).toBe(
    "pass",
  );
  expect(run({ packageJson: { version: "latest", eliware: { apply: ["general"] } } }).status).toBe(
    "fail",
  );
});

test.each([
  {},
  { version: "8.0.0" },
  { version: "8.0.0", eliware: { apply: [] } },
  { version: "8.0.0", eliware: { apply: ["general", ""] } },
  { version: "8.0.0", eliware: { apply: ["general", 7] } },
  { version: 8, eliware: { apply: ["general"] } },
])("rejects malformed package baseline configuration %#", (packageJson) => {
  expect(run({ packageJson })).toMatchObject({ status: "fail" });
});
