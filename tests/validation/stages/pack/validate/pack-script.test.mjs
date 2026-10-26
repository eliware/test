import { expect, test } from "@jest/globals";
import { validatePackScript } from "../../../../../src/validation/stages/pack/validate/pack-script.mjs";

test.each([
  [{ pack: "eliware-test --pack" }, false, null],
  [{ pack: "node bin/eliware-test.mjs --pack" }, true, null],
  [{ pack: "node bin/eliware-test.mjs --pack" }, false, "pack=eliware-test --pack"],
  [{ pack: "eliware-test --pack" }, true, "pack=eliware-test --pack"],
])("validates the pack script for self-hosted mode %s", (scripts, selfHosted, result) => {
  const error = validatePackScript({ scripts }, selfHosted);
  if (result === null) expect(error).toBeNull();
  else expect(error).toContain(result);
});
