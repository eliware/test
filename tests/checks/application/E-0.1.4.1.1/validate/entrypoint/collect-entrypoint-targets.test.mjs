import { expect, test } from "@jest/globals";
import { collectEntrypointTargets } from "../../../../../../src/checks/application/E-0.1.4.1.1/validate/entrypoint/collect-entrypoint-targets.mjs";

test("collects a single bin target", () => {
  expect(collectEntrypointTargets({ bin: "bin/tool.mjs" })).toEqual(["bin/tool.mjs"]);
});

test("collects string targets from a bin map", () => {
  expect(collectEntrypointTargets({ bin: { tool: "bin/tool.mjs", ignored: null } })).toEqual([
    "bin/tool.mjs",
  ]);
});

test("returns no targets when bin is absent or not an object", () => {
  expect(collectEntrypointTargets({})).toEqual([]);
  expect(collectEntrypointTargets({ bin: 3 })).toEqual([]);
});
