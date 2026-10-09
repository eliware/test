import { expect, test } from "@jest/globals";
import { validateDirectToolScript } from "../../../../src/validation/stages/scripts/validate-direct-tool-script.mjs";

test("accepts recognized direct build and typecheck tools", () => {
  expect(
    validateDirectToolScript("webpack --mode production", "build", {
      devDependencies: { webpack: "*" },
    }),
  ).toBeNull();
  expect(
    validateDirectToolScript("tsc --noEmit", "typecheck", {
      devDependencies: { typescript: "*" },
    }),
  ).toBeNull();
});

test("rejects package-script indirection and no-op commands", () => {
  expect(validateDirectToolScript("", "build")).toContain("nonempty");
  expect(validateDirectToolScript("npm run compile", "build")).toContain("direct tool");
  expect(validateDirectToolScript("echo build succeeded", "build")).toContain("recognized");
  expect(validateDirectToolScript("echo skipped", "typecheck")).toContain("recognized");
});

test.each(["tsc --noEmit && echo done", "tsc --noEmit > typecheck.log", "tsc --noEmit; exit 0"])(
  "rejects chained or redirected typecheck commands: %s",
  (script) => {
    expect(
      validateDirectToolScript(script, "typecheck", { devDependencies: { typescript: "*" } }),
    ).toContain("one command");
  },
);

test("requires the direct tool package in package.json", () => {
  expect(validateDirectToolScript("tsc --noEmit", "typecheck", {})).toContain(
    "typescript must be declared",
  );
});
