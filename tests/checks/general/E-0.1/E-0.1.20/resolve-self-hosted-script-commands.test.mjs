import { expect, test } from "@jest/globals";
import { resolveSelfHostedScriptCommands } from "../../../../../src/checks/general/E-0.1/E-0.1.20/resolve-self-hosted-script-commands.mjs";

test("maps every supported self-hosted script to its explicit local command", () => {
  expect(
    resolveSelfHostedScriptCommands(["test", "lint", "audit", "format", "format:check", "pack"]),
  ).toEqual({
    scripts: {
      test: "node bin/eliware-test.mjs",
      lint: "node bin/eliware-test.mjs --lint",
      audit: "node bin/eliware-test.mjs --audit",
      format: "node bin/eliware-test.mjs --format",
      "format:check": "node bin/eliware-test.mjs --format-check",
      pack: "node bin/eliware-test.mjs --pack",
    },
    failures: [],
  });
});

test("reports any required script without an explicit self-hosted mapping", () => {
  expect(resolveSelfHostedScriptCommands(["future-script"])).toEqual({
    scripts: {},
    failures: ["No self-hosted command is defined for required script future-script."],
  });
});
