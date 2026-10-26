import { expect, test } from "@jest/globals";
import { validatePackScript } from "../../../../../src/validation/stages/pack/validate/pack-script.mjs";

test("accepts standard and self-hosted pack scripts in their matching modes", () => {
  expect(validatePackScript({ scripts: { pack: "eliware-test --pack" } })).toBeNull();
  expect(
    validatePackScript(
      { scripts: { pack: "node bin/eliware-test.mjs --pack" } },
      { selfHosted: true },
    ),
  ).toBeNull();
});

test("rejects a pack script that does not match the selected mode", () => {
  expect(validatePackScript({ scripts: { pack: "node bin/eliware-test.mjs --pack" } })).toContain(
    "define pack=eliware-test --pack",
  );
  expect(
    validatePackScript({ scripts: { pack: "eliware-test --pack" } }, { selfHosted: true }),
  ).toContain("define pack=eliware-test --pack");
});
