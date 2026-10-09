import { expect, test } from "@jest/globals";
import { collectCliEntrypoints } from "../../../../src/checks/cli/E-0.1.5.1.0/collect-cli-entrypoints.mjs";

test("collects string and command-map entrypoints", () => {
  expect(collectCliEntrypoints({ bin: "bin/cli.mjs" })).toEqual(["bin/cli.mjs"]);
  expect(collectCliEntrypoints({ bin: { cli: "bin/cli.mjs" } })).toEqual(["bin/cli.mjs"]);
});

test("ignores invalid bin values", () => {
  expect(collectCliEntrypoints()).toEqual([]);
  expect(collectCliEntrypoints({ bin: { cli: "", other: 4 } })).toEqual([]);
  expect(collectCliEntrypoints({})).toEqual([]);
});
