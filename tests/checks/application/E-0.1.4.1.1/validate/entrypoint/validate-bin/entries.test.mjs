import { expect, test } from "@jest/globals";
import { validateBinEntries } from "../../../../../../../src/checks/application/E-0.1.4.1.1/validate/entrypoint/validate-bin/entries.mjs";

test("accepts valid command names and targets", () => {
  expect(validateBinEntries({ app: "bin/app.mjs", "app-cli": "bin/cli.mjs" })).toEqual([]);
});

test("rejects invalid command names and empty targets", () => {
  expect(validateBinEntries({ "bad name": "bin/app.mjs", app: null })).toEqual([
    "package.json bin command name is invalid: bad name.",
    "package.json bin target for app must be a nonempty path string.",
  ]);
});

test("ignores non-map values", () => {
  expect(validateBinEntries("bin/app.mjs")).toEqual([]);
});
