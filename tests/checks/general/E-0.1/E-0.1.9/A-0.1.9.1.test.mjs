import { expect, test } from "@jest/globals";
import { run } from "../../../../../src/checks/general/E-0.1/E-0.1.9/A-0.1.9.1.mjs";

test("requires a valid package baseline and selected documents", () => {
  expect(run({ packageJson: { version: "9.0.0", eliware: { apply: ["general"] } } }).status).toBe(
    "pass",
  );
  expect(run({ packageJson: { version: "latest", eliware: { apply: ["general"] } } }).status).toBe(
    "fail",
  );
});

test.each([
  {},
  { version: "9.0.0" },
  { version: "9.0.0", eliware: { apply: [] } },
  { version: "9.0.0", eliware: { apply: ["general", ""] } },
  { version: "9.0.0", eliware: { apply: ["general", 7] } },
  { version: 8, eliware: { apply: ["general"] } },
  { version: "01.2.3", eliware: { apply: ["general"] } },
  { version: "1.2.3-", eliware: { apply: ["general"] } },
  { version: "1.2.3-alpha..1", eliware: { apply: ["general"] } },
  { version: "v1.2.3", eliware: { apply: ["general"] } },
])("rejects malformed package baseline configuration %#", (packageJson) => {
  expect(run({ packageJson })).toMatchObject({ status: "fail" });
});

test.each(["8.0.0", "9.1.0", "9.0.1-alpha", "9.0.1+build.1"])(
  "rejects package version %s outside the current convention release sequence",
  (version) => {
    expect(run({ packageJson: { version, eliware: { apply: ["general"] } } })).toMatchObject({
      status: "fail",
    });
  },
);

test.each(["9.0.0", "9.0.1", "9.0.999"])(
  "accepts patch release %s for the current convention baseline",
  (version) => {
    expect(run({ packageJson: { version, eliware: { apply: ["general"] } } })).toMatchObject({
      status: "pass",
    });
  },
);

test("rejects profiles absent from the bundled catalog", () => {
  expect(run({ packageJson: { version: "9.0.0", eliware: { apply: ["missing"] } } })).toMatchObject(
    { status: "fail" },
  );
});
