import { expect, test } from "@jest/globals";
import { validateEntrypointTargetPath } from "../../../../../../src/checks/application/E-0.1.4.1.1/validate/entrypoint/target-path.mjs";

test.each([
  [null, "nonempty repository-relative path"],
  ["", "nonempty repository-relative path"],
  ["  ", "nonempty repository-relative path"],
  ["/repo/bin/tool.mjs", "nonempty repository-relative path"],
  ["C:\\bin\\tool.mjs", "nonempty repository-relative path"],
  ["/bin/tool.mjs", "nonempty repository-relative path"],
  ["src/tool.mjs", "canonical path"],
  ["bin/../tool.mjs", "canonical path"],
  ["bin//tool.mjs", "canonical path"],
  ["bin/name:stream", "canonical path"],
])("rejects invalid target %s", (target, message) => {
  expect(validateEntrypointTargetPath(target).error).toContain(message);
});

test.each(["bin/tool.mjs", "./bin/tool.mjs", "bin\\tool.mjs"])(
  "returns a normalized target path for %s",
  (target) => {
    expect(validateEntrypointTargetPath(target)).toEqual({ path: "bin/tool.mjs", error: null });
  },
);
