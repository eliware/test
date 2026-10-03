import { expect, test } from "@jest/globals";
import { validateProfileScriptCommand } from "../../../../../src/checks/general/E-0.1/E-0.1.20/validate-profile-script-command.mjs";

test("accepts direct profile typecheck and build tools", () => {
  expect(validateProfileScriptCommand("typecheck", "tsc --noEmit")).toBeNull();
  expect(
    validateProfileScriptCommand("typecheck", "node_modules/.bin/vue-tsc --noEmit"),
  ).toBeNull();
  expect(validateProfileScriptCommand("build", "vite build --emptyOutDir")).toBeNull();
  expect(validateProfileScriptCommand("build", "webpack --mode production")).toBeNull();
  expect(validateProfileScriptCommand("start", "node server.mjs")).toBeNull();
});

test("rejects no-op and unrelated typecheck or build commands", () => {
  for (const command of ["echo skipped", "jest", "npm run tsc"]) {
    expect(validateProfileScriptCommand("typecheck", command)).toContain("direct typechecker");
  }
  for (const command of ["echo skipped", "jest", "node build.mjs", "vite preview"]) {
    expect(validateProfileScriptCommand("build", command)).toContain("direct build tool");
  }
  for (const command of [
    "tsc --noEmit || true",
    "webpack && rm -rf dist",
    "vite build; true",
    "tsc $(touch escaped)",
    "tsc `touch escaped`",
    'tsc "$(touch escaped)"',
    "tsc\\ --noEmit",
  ]) {
    expect(validateProfileScriptCommand("typecheck", command)).toContain("one direct");
  }
});
