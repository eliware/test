import { expect, test } from "@jest/globals";
import { validateImplementationPlacement } from "../../../../../src/checks/application/E-0.1.4.1.2/validate/implementation-placement.mjs";

test("rejects maintained implementation modules outside approved roots", () => {
  expect(
    validateImplementationPlacement(["lib/worker.mjs", "tools/helper.ts", "src/main.mjs"]),
  ).toEqual([
    "lib/worker.mjs is an implementation module outside its allowed root.",
    "tools/helper.ts is an implementation module outside its allowed root.",
  ]);
});

test("allows source, launchers, tests, fixtures, and examples", () => {
  expect(
    validateImplementationPlacement([
      "src/main.mjs",
      "bin/launch.mjs",
      "tests/main.test.mjs",
      "test-fixtures/example.mjs",
      "examples/demo.js",
    ]),
  ).toEqual([]);
});

test("allows only package-script validators under scripts/", () => {
  expect(
    validateImplementationPlacement(
      ["scripts/validate.mjs", "scripts/helper.mjs", "src/main.mjs"],
      [],
      { scripts: { validate: "node scripts/validate.mjs" } },
    ),
  ).toEqual(["scripts/helper.mjs is an implementation module outside its allowed root."]);
  expect(
    validateImplementationPlacement(["lib/validate.mjs"], [], {
      scripts: { validate: "node lib/validate.mjs" },
    }),
  ).toEqual(["lib/validate.mjs is an implementation module outside its allowed root."]);
});

test("allows Discord and MCP discovery modules for their profiles", () => {
  expect(
    validateImplementationPlacement(
      ["commands/start.mjs", "events/ready.mjs", "tools/echo.mjs"],
      ["discord", "mcp-server"],
    ),
  ).toEqual([]);
});

test("does not allow discovery modules without their profiles", () => {
  expect(validateImplementationPlacement(["commands/start.mjs"], ["web"])).toEqual([
    "commands/start.mjs is an implementation module outside its allowed root.",
  ]);
});
