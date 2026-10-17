import { expect, test } from "@jest/globals";
import { findScriptOperands } from "../../../../../src/checks/general/E-0.1.0.1.6/validate-knit-configuration/find-script-operands.mjs";

test.each([
  ["node .knit/check.mjs", [".knit/check.mjs"]],
  ["node --eval 'run()'", []],
  ["bun ./check.mjs", ["./check.mjs"]],
  ["bun run ./check.mjs", ["./check.mjs"]],
  ["bun test", []],
  ["deno run ./check.ts", ["./check.ts"]],
  ["deno test", []],
  ["tsx ./check.ts", ["./check.ts"]],
  ["ts-node ./check.ts", ["./check.ts"]],
  ["python ./check.py", ["./check.py"]],
  ["python -c 'run()'", []],
  ["bash ./check.sh", ["./check.sh"]],
  ["bash -c 'echo ./config'", []],
  ["pwsh -File .knit/check.ps1", [".knit/check.ps1"]],
  ["custom-validator ./output ./config", []],
  ["node ''", []],
])("finds script operands in %s", (command, expected) => {
  expect(findScriptOperands(command)).toEqual(expected);
});
