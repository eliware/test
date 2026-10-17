import { expect, test } from "@jest/globals";
import { inspectEntrypointTarget } from "../../../../../../src/checks/application/E-0.1.4.1.1/validate/entrypoint/canonical-target.mjs";

test.each(["bin/index.mjs", "./bin/index.mjs", "bin\\index.mjs"])(
  "accepts canonical repository-relative target %s",
  (target) => {
    expect(inspectEntrypointTarget(target)).toEqual({ path: "bin/index.mjs" });
  },
);

test.each([null, "", "  ", "C:\\bin\\index.mjs", "/bin/index.mjs"])(
  "rejects non-relative target %s",
  (target) => {
    expect(inspectEntrypointTarget(target)).toEqual({ error: "relative" });
  },
);

test.each(["src/index.mjs", "bin/../src/index.mjs", "bin//index.mjs", "bin/name:stream"])(
  "rejects noncanonical target %s",
  (target) => {
    expect(inspectEntrypointTarget(target)).toEqual({ error: "canonical" });
  },
);
