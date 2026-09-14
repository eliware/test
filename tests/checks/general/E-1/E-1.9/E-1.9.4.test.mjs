import { expect, test } from "@jest/globals";
import { run } from "../../../../../src/checks/general/E-1/E-1.9/E-1.9.4.mjs";

test("requires both authority boundaries", () => {
  const packageJson = {
    eliware: {
      authority: { authoritativeFor: ["validation"], notAuthoritativeFor: ["operations"] },
    },
  };
  expect(run({ packageJson }).status).toBe("pass");
  expect(run({ packageJson: { eliware: { authority: { authoritativeFor: [] } } } }).status).toBe(
    "fail",
  );
});

test.each([
  undefined,
  null,
  {},
  { authoritativeFor: [] , notAuthoritativeFor: ["operations"] },
  { authoritativeFor: ["   "], notAuthoritativeFor: ["operations"] },
  { authoritativeFor: [7], notAuthoritativeFor: ["operations"] },
  { authoritativeFor: ["validation"], notAuthoritativeFor: [] },
  { authoritativeFor: ["validation"], notAuthoritativeFor: ["   "] },
  { authoritativeFor: ["validation"], notAuthoritativeFor: [null] },
  { authoritativeFor: ["validation"], notAuthoritativeFor: "operations" },
])("rejects malformed authority boundaries %#", (authority) => {
  expect(run({ packageJson: { eliware: { authority } } })).toEqual(
    expect.objectContaining({ status: "fail" }),
  );
});
