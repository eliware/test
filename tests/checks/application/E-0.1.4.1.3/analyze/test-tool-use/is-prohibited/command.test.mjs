import { expect, test } from "@jest/globals";
import isProhibitedTestToolCommand from "../../../../../../../src/checks/application/E-0.1.4.1.3/analyze/test-tool-use/is-prohibited/command.mjs";

test("recognizes prohibited launcher commands", () => {
  expect(
    isProhibitedTestToolCommand(
      {
        type: "CallExpression",
        callee: {
          type: "Identifier",
          name: "spawnSync",
        },
        arguments: [
          {
            type: "StringLiteral",
            value: "jest",
          },
        ],
      },
      new Map(),
      new Set(["spawnSync"]),
      false,
    ),
  ).toBe(true);
});

test("ignores other calls", () => {
  expect(
    isProhibitedTestToolCommand(
      {
        type: "CallExpression",
        callee: {
          type: "Identifier",
          name: "readFile",
        },
        arguments: [],
      },
      new Map(),
      new Set(["spawnSync"]),
      false,
    ),
  ).toBe(false);
});
