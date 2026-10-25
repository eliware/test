import { expect, test } from "@jest/globals";
import { inspectEntrypointTarget } from "../../../../../../src/checks/application/E-0.1.4.1.1/validate/entrypoint/canonical-target.mjs";

test("normalizes mixed separators in a nested bin target", () => {
  expect(inspectEntrypointTarget("./bin\\nested/tool.mjs")).toEqual({
    path: "bin/nested/tool.mjs",
  });
});
