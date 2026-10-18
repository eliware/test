import { expect, test } from "@jest/globals";
import { validateImplementationPlacement } from "../../../../../src/checks/application/E-0.1.4.1.2/validate/implementation-placement.mjs";

test("allows application launchers in bin/", () => {
  expect(validateImplementationPlacement(["bin/launch.mjs"])).toEqual([]);
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

test("allows the root webpack configuration only for web repositories", () => {
  expect(validateImplementationPlacement(["webpack.config.mjs"], ["web"])).toEqual([]);
  expect(validateImplementationPlacement(["webpack.config.mjs"], ["application"])).toEqual([
    "webpack.config.mjs is an implementation module outside its allowed root.",
  ]);
});
