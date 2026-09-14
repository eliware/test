import { expect, test } from "@jest/globals";
import { validateDirectToolScript } from "../../src/checks/validate-direct-tool-script.mjs";

test("accepts recognized direct build and typecheck tools", () => {
  expect(validateDirectToolScript("webpack --mode production", "build")).toBeNull();
  expect(validateDirectToolScript("tsc --noEmit", "typecheck")).toBeNull();
});

test("rejects package-script indirection and no-op commands", () => {
  expect(validateDirectToolScript("", "build")).toContain("nonempty");
  expect(validateDirectToolScript("npm run compile", "build")).toContain("direct tool");
  expect(validateDirectToolScript("echo build succeeded", "build")).toContain("recognized");
  expect(validateDirectToolScript("echo skipped", "typecheck")).toContain("recognized");
});
